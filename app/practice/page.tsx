"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabaseClient";

type Item = {
  id: number;
  prompt: string;
  options: string[];
  answer: { correct: string };
  explain?: string | null;
};

export default function PracticePage() {
  const router = useRouter();
  const startRef = useRef<number>(Date.now());

  const [item, setItem] = useState<Item | null>(null);
  const [msg, setMsg] = useState("Loading...");
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadOne() {
    setLocked(false);
    setFeedback("");
    setMsg("Loading...");
    startRef.current = Date.now();

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("items")
      .select("id,prompt,options,answer,explain")
      .limit(50);

    if (error) {
      setMsg("Error: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      setMsg("No items found.");
      return;
    }

    const picked = data[Math.floor(Math.random() * data.length)] as any;

    setItem({
      id: picked.id,
      prompt: picked.prompt,
      options: picked.options,
      answer: picked.answer,
      explain: picked.explain,
    });

    setMsg("");
  }

  useEffect(() => {
    loadOne();
  }, []);

  async function submit(choice: string) {
    if (!item || locked) return;

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      router.push("/login");
      return;
    }

    setLocked(true);

    const correct = item.answer?.correct === choice;
    const timeSpent = Date.now() - startRef.current;

    await supabase.from("attempts").insert({
      user_id: userRes.user.id,
      item_id: item.id,
      user_answer: { choice },
      is_correct: correct,
      time_spent_ms: timeSpent,
    });

    setFeedback(correct ? "Correct ✅" : `Wrong ❌ Answer: ${item.answer.correct}`);
  }

  return (
    <main style={{ padding: 40, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Practice</h1>

      {msg && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          {msg}
        </div>
      )}

      {item && (
        <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 16 }}>
          <div style={{ fontSize: 18 }}>{item.prompt}</div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {item.options.map((op) => (
              <button
                key={op}
                style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", fontWeight: 700 }}
                onClick={() => submit(op)}
                disabled={locked}
              >
                {op}
              </button>
            ))}
          </div>

          {feedback && (
            <div style={{ marginTop: 14 }}>
              <b>{feedback}</b>
              {item.explain && <div style={{ marginTop: 8 }}>{item.explain}</div>}
              <button
                style={{ marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid #000", background: "#000", color: "#fff" }}
                onClick={loadOne}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <button
        style={{ marginTop: 20 }}
        onClick={() => router.push("/")}
      >
        Back
      </button>
    </main>
  );
}