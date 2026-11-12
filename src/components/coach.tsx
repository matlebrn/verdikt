"use client";

import { useEffect, useRef, useState } from "react";
import { COACH_MAX_TURNS } from "@/lib/config";
import type { CoachTurn, Verdict } from "@/lib/types";
import { authHeaders } from "./auth";

const STARTERS = [
  "Je lui réponds quoi maintenant ?",
  "Comment m'excuser sans me rabaisser ?",
  "Je dois répondre tout de suite ou laisser passer un peu de temps ?",
  "Tu ne crois pas que c'est surtout de sa faute ?",
];

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`chip cursor-pointer ${done ? "chip-good" : "bg-surface text-me"}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* presse-papiers indisponible */
        }
      }}
    >
      {done ? "Copié" : "Copier"}
    </button>
  );
}

type Props = {
  verdict: Verdict;
  relation?: string;
  context?: string;
  turns: CoachTurn[];
  onTurns: (t: CoachTurn[]) => void;
};

export function Coach({ verdict, relation, context, turns, onTurns }: Props) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<{ remaining: number; limit: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const asked = turns.filter((t) => t.role === "user").length;
  const full = asked >= COACH_MAX_TURNS;

  useEffect(() => {
    if (turns.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns.length, busy]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy || full) return;
    setBusy(true);
    setError(null);
    const withQuestion: CoachTurn[] = [...turns, { role: "user", text: q }];
    onTurns(withQuestion);
    setQuestion("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          verdict,
          relation: relation || undefined,
          context: context?.trim() || undefined,
          history: turns.map(({ role, text, message }) => ({
            role,
            text: message ? `${text}\n\nMessage proposé : ${message}` : text,
          })),
          question: q,
        }),
      });
      const data = await res.json().catch(() => null);
      if (typeof data?.remaining === "number") setLeft({ remaining: data.remaining, limit: data.limit });
      if (!res.ok || !data?.answer) {
        onTurns(turns);
        setQuestion(q);
        setError(data?.error || "Le coach n'a pas pu répondre. Réessaie.");
        return;
      }
      onTurns([...withQuestion, { role: "coach", text: data.answer, message: data.message }]);
    } catch {
      onTurns(turns);
      setQuestion(q);
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card coach" aria-label="Poser une question au coach">
      <h2 className="flex items-center gap-3 text-2xl font-bold">
        <span className="badge bg-me text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3c5 0 9 3.6 9 8s-4 8-9 8c-1.2 0-2.4-.2-3.4-.6L4 20l1.3-3.8C3.9 14.8 3 13 3 11c0-4.4 4-8 9-8z" />
          </svg>
        </span>
        Parle de la suite avec Verdikt
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted">
        Pose une question, colle ta réponse avant de l'envoyer, ou donne un détail que l'analyse ne connaissait pas.
      </p>

      {turns.length > 0 && (
        <ol className="mt-5 flex flex-col gap-3">
          {turns.map((t, i) => (
            <li key={i} className={t.role === "user" ? "self-end max-w-[85%]" : "max-w-[92%]"}>
              {t.role === "user" ? (
                <p className="bubble bubble-me m-0! max-w-none! whitespace-pre-wrap">{t.text}</p>
              ) : (
                <div className="coach-answer">
                  <p className="whitespace-pre-wrap">{t.text}</p>
                  {t.message && (
                    <div className="mt-3 rounded-2xl bg-me-soft p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-me">À envoyer</p>
                        <Copy text={t.message} />
                      </div>
                      <p className="mt-1.5 font-medium whitespace-pre-wrap">{t.message}</p>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
          {busy && (
            <li className="coach-answer text-muted" aria-live="polite">
              <span className="typing" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="sr-only">Verdikt réfléchit…</span>
            </li>
          )}
        </ol>
      )}
      <div ref={endRef} />

      {turns.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button key={s} type="button" className="starter" disabled={busy} onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-alert-soft px-4 py-3 font-medium">
          {error}
        </p>
      )}

      {full ? (
        <p className="mt-4 text-sm text-muted">
          Cette discussion est complète. Relance une analyse avec la suite de la conversation pour repartir.
        </p>
      ) : (
        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <label htmlFor="coach-q" className="sr-only">
            Ta question
          </label>
          <textarea
            id="coach-q"
            className="field min-h-12 flex-1 resize-none"
            rows={1}
            value={question}
            maxLength={1500}
            onChange={(e) => {
              setQuestion(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                e.preventDefault();
                ask(question);
              }
            }}
            placeholder="Ex. : et si je lui envoie « ok bah laisse tomber alors » ?"
          />
          <button type="submit" className="btn btn-primary shrink-0" disabled={busy || question.trim().length < 2}>
            Envoyer
          </button>
        </form>
      )}
      {left && (
        <p className="mt-2 text-sm text-muted">
          {left.remaining > 0
            ? `${left.remaining} question${left.remaining > 1 ? "s" : ""} restante${left.remaining > 1 ? "s" : ""} aujourd'hui.`
            : "Plus de questions pour aujourd'hui."}
        </p>
      )}
    </section>
  );
}
