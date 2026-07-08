import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "get_data") {
      const userId = searchParams.get("userId");
      if (!userId) {
        return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
      }

      // 1. Fetch apps
      const { data: dbApps, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", userId);

      if (appsError) {
        console.error("Supabase API: Error fetching applications:", appsError);
        return NextResponse.json({ error: appsError.message }, { status: 500 });
      }

      const mappedApps = (dbApps || []).map((a: any) => {
        let supabaseUrl = "";
        let supabaseTable = "";
        if (a.github_repo) {
          try {
            const config = JSON.parse(a.github_repo);
            supabaseUrl = config.supabaseUrl || "";
            supabaseTable = config.supabaseTable || "";
          } catch (e) {
            // Ignore parse errors if github_repo is not JSON or is different
          }
        }
        return {
          id: a.id,
          name: a.name,
          apiKey: a.api_key,
          status: (a.status?.toString().trim().toLowerCase() === "active") ? "Active" : "inactive",
          supabaseUrl,
          supabaseTable,
          createdAt: a.created_at
        };
      });

      const apiKeys = mappedApps.map(a => a.apiKey);

      // 2. Fetch errors
      let mappedErrors: any[] = [];
      if (apiKeys.length > 0) {
        const { data: dbErrors, error: errorsError } = await supabase
          .from("errors")
          .select("*")
          .in("api_key", apiKeys)
          .order("timestamp", { ascending: false });

        if (errorsError) {
          console.error("Supabase API: Error fetching error logs:", errorsError);
        } else if (dbErrors) {
          mappedErrors = dbErrors.map((e: any) => ({
            id: e.id,
            apiKey: e.api_key,
            errorName: e.error_name,
            errorMessage: e.error_message,
            stackTrace: e.stack_trace || "",
            severity: e.severity,
            context: e.context || {},
            timestamp: e.timestamp,
            status: e.status,
            aiAnalysis: e.ai_analysis || ""
          }));
        }
      }

      return NextResponse.json({ apps: mappedApps, errors: mappedErrors });
    }

    if (action === "get_user") {
      const userId = searchParams.get("userId");
      if (!userId) {
        return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
      }

      const { data: dbUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Supabase API: Error fetching user:", userError);
        return NextResponse.json({ user: null, error: userError.message });
      }

      return NextResponse.json({ user: dbUser });
    }

    if (action === "get_subscription") {
      const userId = searchParams.get("userId");
      if (!userId) {
        return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
      }

      const { data: dbSubscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        // If subscriptions table doesn't exist yet, we handle it gracefully so it doesn't crash settings load
        console.warn("Supabase API: Error fetching subscription (table may not exist yet or other error):", subError);
        return NextResponse.json({ subscription: null });
      }

      return NextResponse.json({ subscription: dbSubscription });
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("Supabase API error (GET):", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action parameter is required" }, { status: 400 });
    }

    if (action === "create_app") {
      const { id, name, apiKey, status, supabaseUrl, supabaseTable, userId, createdAt } = body;
      const configJson = JSON.stringify({
        supabaseUrl: supabaseUrl || "",
        supabaseTable: supabaseTable || ""
      });
      const { error } = await supabase.from("applications").insert({
        id,
        name,
        api_key: apiKey,
        status,
        github_repo: configJson,
        user_id: userId,
        created_at: createdAt
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "update_app") {
      const { id, status, supabaseUrl, supabaseTable } = body;
      const configJson = JSON.stringify({
        supabaseUrl: supabaseUrl || "",
        supabaseTable: supabaseTable || ""
      });
      const { error } = await supabase
        .from("applications")
        .update({
          status,
          github_repo: configJson
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete_app") {
      const { id, apiKey } = body;
      
      // Delete error logs for this API key first
      const { error: errorLogsDelete } = await supabase
        .from("errors")
        .delete()
        .eq("api_key", apiKey);

      if (errorLogsDelete) {
        console.error("Supabase API: Error deleting application error logs:", errorLogsDelete);
      }

      // Delete the application record
      const { error: appDeleteError } = await supabase
        .from("applications")
        .delete()
        .eq("id", id);

      if (appDeleteError) {
        return NextResponse.json({ error: appDeleteError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "update_error_ai") {
      const { id, aiAnalysis } = body;
      const { error } = await supabase
        .from("errors")
        .update({ ai_analysis: aiAnalysis })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "disconnect_github") {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
      }

      const { error } = await supabase
        .from("users")
        .update({ github_access_token: null })
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "insert_errors") {
      const { errors } = body;
      if (!Array.isArray(errors)) {
        return NextResponse.json({ error: "errors must be an array" }, { status: 400 });
      }

      const mapped = errors.map((e: any) => ({
        id: e.id,
        api_key: e.apiKey,
        error_name: e.errorName,
        error_message: e.errorMessage,
        stack_trace: e.stackTrace,
        severity: e.severity,
        context: e.context,
        status: e.status,
        timestamp: e.timestamp,
        ai_analysis: e.aiAnalysis || ""
      }));

      const { error } = await supabase.from("errors").insert(mapped);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "create_checkout_session") {
      const { productId, userId, email, name, returnUrl } = body;

      if (!userId || !email || !productId) {
        return NextResponse.json({ error: "userId, email, and productId are required" }, { status: 400 });
      }

      const apiKey = process.env.DODO_PAYMENTS_API_KEY;

      if (!apiKey) {
        return NextResponse.json({ 
          error: "Dodo Payments billing is not fully configured." 
        }, { status: 500 });
      }

      try {
        const response = await fetch("https://live.dodopayments.com/checkouts", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer_email: email,
            customer_name: name,
            metadata: { user_id: userId },
            success_url: returnUrl || `${req.nextUrl.origin}/settings`,
            cancel_url: returnUrl || `${req.nextUrl.origin}/settings`
          })
        });

        const text = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          console.error("Supabase API: Failed to parse Dodo API response:", text);
          return NextResponse.json({ error: "Invalid response from billing service" }, { status: 502 });
        }

        if (!response.ok) {
          console.error("Supabase API: Dodo API error:", responseData);
          return NextResponse.json({ error: responseData.message || "Failed to initiate billing session" }, { status: response.status });
        }

        const checkoutUrl = responseData.checkout_url || responseData.url;
        if (!checkoutUrl) {
          console.error("Supabase API: Dodo API returned success but no URL:", responseData);
          return NextResponse.json({ error: "Billing service returned no URL" }, { status: 502 });
        }
        
        return NextResponse.json({ url: checkoutUrl });
      } catch (e: any) {
        console.error("Network error when connecting to Dodo Payments:", e);
        return NextResponse.json({ error: e.message || "Failed to contact billing service" }, { status: 500 });
      }
    }

    if (action === "update_subscription") {
      const { userId, subscriptionId, status, trialEnd, currentPeriodEnd } = body;
      
      if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }

      // 1. Update Subscriptions Table
      const { error: subError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          dodo_subscription_id: subscriptionId,
          status: status,
          trial_end: trialEnd,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (subError) {
        console.error("Supabase API: Error updating subscription:", subError);
        return NextResponse.json({ error: subError.message }, { status: 500 });
      }

      // 2. Sync Plan status to Users Table
      const planValue = (status === "active" || status === "trialing") ? "Premium" : "Free";
      const { error: userError } = await supabase
        .from("users")
        .update({ plan: planValue })
        .eq("id", userId);

      if (userError) {
        console.error("Supabase API: Error updating user plan:", userError);
        // We don't fail the whole request here, but log it
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action handler not found" }, { status: 404 });
  } catch (err: any) {
    console.error("Supabase API error (POST):", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
