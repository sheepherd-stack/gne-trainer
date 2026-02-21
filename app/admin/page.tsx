"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../src/lib/supabaseClient";

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
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [me, setMe] = useState<{ email: string; role: string } | null>(null);
  const [msg, setMsg] = useState<string>("Loading...");
  const [items, setItems] = useState<ItemRow[]>([]);

  // 新增题目表单
  const [type, setType] = useState<"A" | "B" | "C" | "D">("A");
  const [prompt, setPrompt] = useState("");
  const [optionsText, setOptionsText] = useState(`["Complete","Incomplete"]`);
  const [answerText, setAnswerText] = useState(`{"correct":"Complete"}`);
  const [explain, setExplain] = useState("");
  const [difficulty, setDifficulty] = useState(1);

  // 批量导入（每行一题 JSON）
  const [bulk, setBulk] = useState("");

  async function loadMeAndItems() {
    if (!supabase) return;

    setMsg("Loading...");
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      router.push("/login");
      return;
    }

    // 读自己的 role
    const { data: prof, error: e1 } = await supabase
      .from("profiles")
      .select("email,role")
      .eq("id", userRes.user.id)
      .single();

    if (e1) {
      setMsg("Profile error: " + e1.message);
      return;
    }

    if (!prof || prof.role !== "admin") {
      router.push("/");
      return;
    }

    setMe({ email: prof.email ?? userRes.user.email ?? "", role: prof.role });

    // 读题库
    const { data, error } = await supabase
      .from("items")
      .select("id,type,prompt,options,answer,explain,difficulty,created_at")
      .order("id", { ascending: false })
      .limit(50);

    if (error) {
      setMsg("Load items error: " + error.message);
      return;
    }

    setItems((data ?? []) as any);
    setMsg("");
  }

  useEffect(() => {
    loadMeAndItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (error) {
        alert("Insert failed: " + error.message);
        return;
      }

      setPrompt("");
      setExplain("");
      await loadMeAndItems();
      alert("Inserted ✅");
    } catch (err: any) {
      alert("JSON format error in options/answer. " + (err?.message ?? ""));
    }
  }

  async function del(id: number) {
    if (!supabase) return;
    if (!confirm("Delete item " + id + " ?")) return;

    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    await loadMeAndItems();
  }

  // 批量导入：每行一个 JSON，例如：
  // {"type":"A","prompt":"In the morning.","options":["Complete","Incomplete"],"answer":{"correct":"Incomplete"},"explain":"...","difficulty":1}
  async function importBulk() {
    if (!supabase) return;

    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert("No lines.");
      return;
    }

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
      alert("Line JSON error. Check your format. " + (e?.message ?? ""));
      return;
    }

    const { error } = await supabase.from("items").insert(rows);
    if (error) {
      alert("Bulk insert failed: " + error.message);
      return;
    }

    setBulk("");
    await loadMeAndItems();
    alert("Imported ✅ (" + rows.length + " items)");
  }

  return (
    <main style={{ padding: 30, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>Admin · Item Bank</h1>

      {msg && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          {msg}
        </div>
      )}

      {me && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          Logged in as <b>{me.email}</b> · role: <b>{me.role}</b>
        </div>
      )}

      {/* 新增题目 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Add One Item</h2>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, marginTop: 12 }}>
          <div>Type</div>
          <select value={type} onChange={(e) => setType(e.target.value as any)} style={{ padding: 10, borderRadius: 10 }}>
            <option value="A">A 完整句判断</option>
            <option value="B">B 填空选词</option>
            <option value="C">C 逗号断句关系</option>
            <option value="D">D 句际过渡关系</option>
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

      {/* 批量导入 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Bulk Import (JSON lines)</h2>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
          每行一个 JSON。示例：
          <pre style={{ whiteSpace: "pre-wrap" }}>
{`{"type":"A","prompt":"In the morning.","options":["Complete","Incomplete"],"answer":{"correct":"Incomplete"},"difficulty":1}`}
          </pre>
        </div>

        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={8}
          style={{ width: "100%", padding: 10, borderRadius: 10 }}
          placeholder="Paste JSON lines here..."
        />

        <button
          onClick={importBulk}
          style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #000", background: "#000", color: "#fff", fontWeight: 900 }}
        >
          Import
        </button>
      </section>

      {/* 列表 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Latest Items (50)</h2>

        <button onClick={loadMeAndItems} style={{ marginTop: 10, padding: 10, borderRadius: 10 }}>
          Refresh
        </button>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {items.map((it) => (
            <div key={it.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                #{it.id} · {it.type} · diff {it.difficulty ?? 1}
              </div>
              <div style={{ marginTop: 6, fontWeight: 800 }}>{it.prompt}</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                options: {JSON.stringify(it.options)} <br />
                answer: {JSON.stringify(it.answer)}
              </div>

              <button onClick={() => del(it.id)} style={{ marginTop: 10, padding: 8, borderRadius: 10 }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      <button onClick={() => router.push("/")} style={{ marginTop: 18, padding: 12, borderRadius: 12, width: "100%" }}>
        Back
      </button>
    </main>
  );
}
git add .
git commit -m "feat: admin item bank"
git push