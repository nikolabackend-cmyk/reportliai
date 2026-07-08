import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DODO_WEBHOOK_SECRET = Deno.env.get("DODO_WEBHOOK_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const payload = await req.text();
    const headers = req.headers;
    
    // Standard Webhooks (Svix) Verification logic
    const msgId = headers.get("webhook-id");
    const msgTimestamp = headers.get("webhook-timestamp");
    const msgSignature = headers.get("webhook-signature");

    if (!msgId || !msgTimestamp || !msgSignature) {
      return new Response("Missing headers", { status: 400 });
    }

    // Verify signature
    const secret = DODO_WEBHOOK_SECRET.startsWith("whsec_") 
      ? DODO_WEBHOOK_SECRET.replace("whsec_", "") 
      : DODO_WEBHOOK_SECRET;
    
    const signedContent = `${msgId}.${msgTimestamp}.${payload}`;
    const encoder = new TextEncoder();

    // Helper to decode base64 to Uint8Array
    const base64ToUint8Array = (base64: string) => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    const key = await crypto.subtle.importKey(
      "raw",
      base64ToUint8Array(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedContent)
    );
    
    // Convert signature to base64
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

    const passedSignatures = msgSignature.split(" ");
    let verified = false;
    for (const versionedSig of passedSignatures) {
      const [version, sig] = versionedSig.split(",");
      if (version === "v1" && sig === expectedSignature) {
        verified = true;
        break;
      }
    }

    if (!verified) {
      console.error("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(payload);
    const eventType = body.event_type;
    const data = body.data;
    const userId = data.metadata?.user_id;

    if (!userId) {
      console.log("No user_id in metadata, skipping update");
      return new Response("OK - No User ID", { status: 200 });
    }

    // Determine status
    let status = "active";
    if ([
      "payment.failed", 
      "payment.cancelled", 
      "subscription.cancelled", 
      "subscription.expired", 
      "subscription.failed", 
      "subscription.on_hold"
    ].includes(eventType)) {
      status = "inactive";
    }

    // Map fields
    const updateData = {
      user_id: userId,
      dodo_subscription_id: data.subscription_id || data.id,
      status: status,
      trial_end: data.trial_period_end || null,
      current_period_end: data.billing_period_end || data.current_period_end || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("subscriptions")
      .upsert(updateData, { onConflict: "user_id" });

    if (error) {
      console.error("Database error:", error);
      return new Response("Database error", { status: 500 });
    }

    console.log(`Processed ${eventType} for user ${userId}`);
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
