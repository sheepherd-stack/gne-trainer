"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabaseClient";

export default function HistoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        router.push("/login");
        return;
      }

      const { data: attempts, error } = await supabase
        .from("attempts")
        .select("id,is_correct,time_spent_ms,created_at,item_id")
        .order("id", { ascending: false })
        .limit(50);

      if (error) {
        setMsg("Error: " + error.message);
        return;
      }

      if (!attempts || attempts.length === 0) {
        setMsg("No attempts yet.");
        return;
      }

      const itemIds = Array.from(new Set(attempts.map((a: any) => a.item_id)));
      const { data: items, error: e2 } = await supabase
        .from("items")
        .select("id,prompt")
        .in("id", itemIds);

      if (e2) {
        setMsg("Error: " + e2.message);
        return;
      }

      const map = new Map<number, string>();
      (items ?? []).forEach((it: any) => map.set(it.id, it.prompt));

      const merged = attempts.map((a: any) => ({
        ...a,
        prompt: map.get(a.item_id) ?? "(unknown item)",
      }));

      setRows(merged);
      setMsg("");
    })();
  }, [router]);

  return (
    <main style={{ padding: 40, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>My Attempts</h1>

      {msg && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          {msg}
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ opacity: 0.75, fontSize: 12 }}>
              {new Date(r.created_at).toLocaleString()}
            </div>
            <div style={{ marginTop: 6 }}>{r.prompt}</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <b>{r.is_correct ? "✅ Correct" : "❌ Wrong"}</b> ·{" "}
              {Math.round((r.time_spent_ms ?? 0) / 1000)}s
            </div>
          </div>
        ))}
      </div>

      <button
        style={{ marginTop: 18, padding: 12, borderRadius: 12, border: "1px solid #ddd", width: "100%" }}
        onClick={() => router.push("/")}
      >
        Back
      </button>
    </main>
  );
}