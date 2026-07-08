import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

// A temporary file system fallback for serverless state persistence
const TMP_FILE = path.join("/tmp", "reportli_errors.json");

function readErrors(): any[] {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading temp errors file:", e);
  }
  return [];
}

function writeErrors(errors: any[]) {
  try {
    // Ensure parent directory exists
    const dir = path.dirname(TMP_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TMP_FILE, JSON.stringify(errors, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing temp errors file:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Accept key from custom headers or body payload (be robust with different naming conventions)
    const apiKey = req.headers.get("x-api-key") || 
                   body.apiKey || 
                   body.api_key || 
                   body.API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Authorization failed. Missing x-api-key header or api_key field in request body." },
        { status: 400 }
      );
    }

    const { errorName, errorMessage, stackTrace, severity, context, error_name, error_message, stack_trace } = body;

    const newError = {
      id: "err_" + Math.random().toString(36).substring(2, 9),
      apiKey,
      errorName: errorName || error_name || "RuntimeException",
      errorMessage: errorMessage || error_message || "An unhandled error occurred in production",
      stackTrace: stackTrace || stack_trace || "",
      severity: severity || "error",
      context: context || {},
      timestamp: new Date().toISOString(),
      status: "unresolved"
    };

    // 1. Try to save to Supabase if configured
    let supabaseSaved = false;
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    if (isSupabaseConfigured) {
      try {
        // 1. Check if first error for this API key to auto-activate the app
        const { count, error: countError } = await supabase
          .from("errors")
          .select("*", { count: "exact", head: true })
          .eq("api_key", apiKey);
        
        if (!countError && count === 0) {
          await supabase
            .from("applications")
            .update({ status: "Active" })
            .eq("api_key", apiKey);
        }

        // 2. Analyze with Sarvam AI if key is present
        let aiAnalysis = "";
        const sarvamKey = process.env.SARVAM_API_KEY;
        if (sarvamKey) {
          try {
            const aiResponse = await fetch("https://api.sarvam.ai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "api-subscription-key": sarvamKey
              },
              body: JSON.stringify({
                model: "sarvam-1",
                messages: [
                  { 
                    role: "system", 
                    content: "You are an expert software debugger. Analyze the following error and provide a concise, high-impact root cause and solution in 2 short sentences." 
                  },
                  { 
                    role: "user", 
                    content: `Error: ${newError.errorName}\nMessage: ${newError.errorMessage}\nStack: ${newError.stackTrace.substring(0, 500)}` 
                  }
                ]
              })
            });
            const aiData = await aiResponse.json();
            aiAnalysis = aiData.choices?.[0]?.message?.content || "";
          } catch (aiErr) {
            console.error("Sarvam AI analysis failed:", aiErr);
          }
        }

        const { error } = await supabase.from("errors").insert({
          id: newError.id,
          api_key: newError.apiKey,
          error_name: newError.errorName,
          error_message: newError.errorMessage,
          stack_trace: newError.stackTrace,
          severity: newError.severity,
          context: newError.context,
          status: newError.status,
          timestamp: newError.timestamp,
          ai_analysis: aiAnalysis
        });

        if (!error) {
          supabaseSaved = true;
          console.log("✅ Successfully saved error to Supabase:", newError.id);
        } else {
          console.error("❌ Supabase insert error:", error);
        }
      } catch (err) {
        console.error("❌ Failed to insert to Supabase:", err);
      }
    }

    // 2. Always maintain local fallback as well to guarantee no lost data
    const errors = readErrors();
    errors.unshift(newError);
    writeErrors(errors.slice(0, 100));

    return NextResponse.json({
      success: true,
      message: "Exception ingested by Reportli AI successfully.",
      errorId: newError.id,
      timestamp: newError.timestamp,
      persisted_to: supabaseSaved ? "supabase" : "local_fallback"
    });
  } catch (err: any) {
    console.error("Failed to ingest report:", err);
    return NextResponse.json({ error: "Invalid payload format or server error" }, { status: 500 });
  }
}

// Support fetching errors server-side as well
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("apiKey");

    if (!apiKey) {
      return NextResponse.json({ error: "apiKey query parameter is required" }, { status: 400 });
    }

    // 1. Try fetching from Supabase if configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    if (isSupabaseConfigured) {
      try {
        const { data: dbErrors, error } = await supabase
          .from("errors")
          .select("*")
          .eq("api_key", apiKey)
          .order("timestamp", { ascending: false });

        if (!error && dbErrors) {
          const mappedErrors = dbErrors.map((e: any) => ({
            id: e.id,
            apiKey: e.api_key,
            errorName: e.error_name,
            errorMessage: e.error_message,
            stackTrace: e.stack_trace || "",
            severity: e.severity,
            context: e.context || {},
            timestamp: e.timestamp,
            status: e.status
          }));
          return NextResponse.json({ errors: mappedErrors });
        }
      } catch (err) {
        console.error("❌ Failed to query from Supabase:", err);
      }
    }

    // 2. Fall back to local file system
    const errors = readErrors();
    const appErrors = errors.filter((e: any) => e.apiKey === apiKey);

    return NextResponse.json({ errors: appErrors });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to retrieve errors from server" }, { status: 500 });
  }
}
