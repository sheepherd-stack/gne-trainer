"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../src/lib/supabaseClient";

export default function Home() {
  const [status, setStatus] = useState("Checking connection...");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const { data: userRes } = await supabase.auth.getUser();
      setEmail(userRes.user?.email ?? null);

      const { error } = await supabase.from("items").select("id").limit(1);
      if (error) setStatus("❌ Connection failed");
      else setStatus("✅ Supabase connected successfully");
    }

    run();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main style={{ padding: 40, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>GNE Trainer</h1>
      <p style={{ marginTop: 10 }}>{status}</p>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 14 }}>
        {email ? (
          <>
            <div>Logged in as: <b>{email}</b></div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <Link href="/practice" style={{ padding: 12, borderRadius: 12, border: "1px solid #000", background: "#000", color: "#fff", textAlign: "center", fontWeight: 700 }}>
                Start Practice (Type A)
              </Link>

              <Link href="/history" style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", textAlign: "center" }}>
                My Attempts
              </Link>

              <button
                style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
                onClick={() => supabase.auth.signOut()}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div>Not logged in.</div>
            <Link href="/login" style={{ padding: 12, borderRadius: 12, border: "1px solid #000", background: "#000", color: "#fff", textAlign: "center", fontWeight: 700 }}>
              Login / Register
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}