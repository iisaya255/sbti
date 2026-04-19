"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const signIn = (provider: "github" | "google") => {
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: "4rem auto" }}>
      <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Login</h1>
      <button className="button button-primary" style={{ width: "100%", marginBottom: "0.75rem" }} onClick={() => signIn("github")}>
        Continue with GitHub
      </button>
      <button className="button button-primary" style={{ width: "100%" }} onClick={() => signIn("google")}>
        Continue with Google
      </button>
    </div>
  );
}
