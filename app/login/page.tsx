"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    if (!email || !password) return setMsg("Please enter email and password.");

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else setMsg("Registered. Switch to Login.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else router.push("/");
  }

  return (
    <main style={{ padding: 40, maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>{mode === "login" ? "Login" : "Register"}</h1>
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <input style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg && <div style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}>{msg}</div>}
        <button style={{ padding: 12, borderRadius: 12, border: "1px solid #000", background: "#000", color: "#fff", fontWeight: 800 }} onClick={submit}>
          {mode === "login" ? "Login" : "Create account"}
        </button>
        <button style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }} onClick={() => setMode(mode === "login" ? "register" : "login")}>
          Switch to {mode === "login" ? "Register" : "Login"}
        </button>
      </div>
    </main>
  );
}