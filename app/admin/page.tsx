"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type ItemRow = {
  id: number;
  type: "A" | "B" | "C" | "D";
  prompt: string;
  options: any;
  answer: any;
  explain?: string | null;
  difficulty?: number | null;
  created_at?: string;
};

export default function AdminPage() {
  const router = useRouter();
 const supabase = useMemo(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}, []);

  const [msg, setMsg] = useState<string>("Loading...");
  const [items, setItems] = useState<ItemRow[]>([]);

  const [type, setType] = useState<"A" | "B" | "C" | "D">("A");
  const [prompt, setPrompt] = useState("");
  const [optionsText, setOptionsText] = useState(`["Complete","Incomplete"]`);
  const [answerText, setAnswerText] = useState(`{"correct":"Complete"}`);
  const [explain, setExplain] = useState("");
  const [difficulty, setDifficulty] = useState(1);

  const [bulk, setBulk] = useState("");

  async function loadAll() {
    if (!supabase) return;

    setMsg("Loading...");
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      router.push("/login");
      return;
    }

    const { data: prof, error: e1 } = await supabase
      .from("profiles")
      .select("email,role")
      .eq("id", userRes.user.id)
      .single();

    if (e1) return setMsg("Profile error: " + e1.message);
    if (!prof || prof.role !== "admin") {
      router.push("/");
      return;
    }

    const { data, error } = await supabase
      .from("items")
      .select("id,type,prompt,options,answer,explain,difficulty,created_at")
      .order("id", { ascending: false })
      .limit(50);

    if (error) return setMsg("Load items error: " + error.message);

    setItems((data ?? []) as any);
    setMsg("");
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addOne() {
    if (!supabase) return;

    try {
      const options = JSON.parse(optionsText);
      const answer = JSON.parse(answerText);

      const { error } = await supabase.from("items").insert({
        type,
        prompt,
        options,
        answer,
        explain: explain || null,
        difficulty,
      });

      if (error) return alert("Insert failed: " + error.message);

      setPrompt("");
      setExplain("");
      await loadAll();
      alert("Inserted ✅");
    } catch (err: any) {
      alert("JSON format error: " + (err?.message ?? ""));
    }
  }

  async function del(id: number) {
    if (!supabase) return;
    if (!confirm("Delete item " + id + " ?")) return;

    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return alert("Delete failed: " + error.message);

    await loadAll();
  }

  async function importBulk() {
    if (!supabase) return;

    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return alert("No lines.");

    const rows: any[] = [];
    try {
      for (const line of lines) {
        const obj = JSON.parse(line);
        rows.push({
          type: obj.type,
          prompt: obj.prompt,
          options: obj.options,
          answer: obj.answer,
          explain: obj.explain ?? null,
          difficulty: obj.difficulty ?? 1,
        });
      }
    } catch (e: any) {
      return alert("Line JSON error: " + (e?.message ?? ""));
    }

    const { error } = await supabase.from("items").insert(rows);
    if (error) return alert("Bulk insert failed: " + error.message);

    setBulk("");
    await loadAll();
   alert("Imported ✅ (" + rows.length + ")");
  }

  return (
    <main style={{ padding: 30, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>Admin 路 Item Bank</h1>

      {msg && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          {msg}
        </div>
      )}

      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Add One Item</h2>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, marginTop: 12 }}>
          <div>Type</div>
          <select value={type} onChange={(e) => setType(e.target.value as any)} style={{ padding: 10, borderRadius: 10 }}>
         <option value="A">A Sentence Complete</option>
<option value="B">B Fill-in Choice</option>
<option value="C">C Comma Logic</option>
<option value="D">D Transition Logic</option>
          </select>

          <div>Prompt</div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 10 }} />

          <div>Options (JSON)</div>
          <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 10 }} />

          <div>Answer (JSON)</div>
          <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 10 }} />

          <div>Explain</div>
          <textarea value={explain} onChange={(e) => setExplain(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 10 }} />

          <div>Difficulty</div>
          <input type="number" value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value || "1"))} style={{ padding: 10, borderRadius: 10 }} />
        </div>

        <button
          onClick={addOne}
          style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #000", background: "#000", color: "#fff", fontWeight: 900 }}
        >
          Insert
        </button>
      </section>

      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Bulk Import (JSON lines)</h2>

        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={8}
          style={{ width: "100%", padding: 10, borderRadius: 10 }}
          placeholder='Each line one JSON: {"type":"A","prompt":"...","options":["Complete","Incomplete"],"answer":{"correct":"Complete"},"difficulty":1}'
        />

        <button
          onClick={importBulk}
          style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #000", background: "#000", color: "#fff", fontWeight: 900 }}
        >
          Import
        </button>
      </section>

      <button onClick={() => router.push("/")} style={{ marginTop: 18, padding: 12, borderRadius: 12, width: "100%" }}>
        Back
      </button>
    </main>
  );
}

