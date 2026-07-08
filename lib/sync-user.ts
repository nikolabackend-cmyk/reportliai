import { User as FirebaseUser } from "firebase/auth";

export async function syncUserToSupabase(user: FirebaseUser) {
  if (!user) {
    console.warn("syncUserToSupabase called without user object");
    return;
  }

  console.log("🔄 Attempting to sync user to Supabase:", user.uid);

  try {
    const response = await fetch("/api/sync-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user.uid,
        email: user.email,
        display_name: user.displayName,
        photo_url: user.photoURL,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = "❌ Supabase Sync Error Details: " + JSON.stringify(result.error);
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log("✅ Successfully synced user to Supabase:", result.data);
    return result.data;
  } catch (err: any) {
    console.error("❌ Unexpected error during user sync:", err?.message || err);
    throw err;
  }
}
