export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;
    const secret = process.env.DODO_WEBHOOK_SECRET;

    if (!secret) {
      return new Response(JSON.stringify({ error: "Configuration error" }), { status: 500 });
    }

    // Standard Webhooks (Svix) Verification
    const msgId = headers.get("webhook-id");
    const msgTimestamp = headers.get("webhook-timestamp");
    const msgSignature = headers.get("webhook-signature");

    if (!msgId || !msgTimestamp || !msgSignature) {
      console.error("Webhook Error: Missing Svix headers");
      return new Response(JSON.stringify({ error: "Missing headers" }), { status: 400 });
    }

    // secret should not have whsec_ prefix for the HMAC calculation
    const secretKey = secret.startsWith("whsec_") ? secret.replace("whsec_", "") : secret;
    const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`;
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
      base64ToUint8Array(secretKey),
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
      console.error("Webhook Error: Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const data = body.data;
    const eventType = body.event_type;
    const userId = data.metadata?.user_id;

    console.log(`Webhook received event: ${eventType} for user: ${userId}`);

    if (!userId) {
      return new Response(JSON.stringify({ message: "No user_id in metadata" }), { status: 200 });
    }

    // Determine Status
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
      userId: userId,
      subscriptionId: data.subscription_id || data.id,
      status: status,
      trialEnd: data.trial_period_end || null,
      currentPeriodEnd: data.billing_period_end || data.current_period_end || null,
    };

    // Update database via internal API call (to use the service role client in /api/supabase)
    const supabaseResponse = await fetch(`${new URL(req.url).origin}/api/supabase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_subscription",
        ...updateData
      }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error("Failed to update database via API:", errorText);
      return new Response(JSON.stringify({ error: "Database update failed" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err: any) {
    console.error("Webhook route error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500 });
  }
}
