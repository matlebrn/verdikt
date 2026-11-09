"use client";

import { useState } from "react";
import type { Tone, Verdict } from "@/lib/types";

const CONFIDENCE = {
  low: "Confiance faible : l'extrait est court ou incomplet.",
  medium: "Confiance moyenne : il manque une partie du contexte.",
  high: "Confiance élevée : l'échange est clair et complet.",
} as const;

const KIND = {
  escalation: "Ça dérape",
  calming: "Ça apaise",
  misunderstanding: "Malentendu",
  turning_point: "Tournant",
} as const;

const TONE_ROWS: { key: keyof Omit<Tone, "comment">; label: string; hint: string }[] = [
  { key: "aggressiveness", label: "Attaque", hint: "reproches, piques, généralisations" },
  { key: "defensiveness", label: "Défensive", hint: "se justifie, renvoie la faute" },
  { key: "listening", label: "Écoute", hint: "tient compte de ce que dit l'autre" },
  { key: "clarity", label: "Clarté", hint: "dit clairement ce qu'il ou elle veut" },
];

/** La balance : la barre penche du côté de celui qui porte le plus de responsabilité. */
export function Balance({ me, other, meName, otherName }: { me: number; other: number; meName: string; otherName: string }) {
  const tilt = Math.max(-5, Math.min(5, (other - me) / 10));
  return (
    <div className="py-5">
      <div
        className="balance flex h-16 overflow-hidden rounded-2xl font-display text-2xl font-extrabold"
        style={{ transform: `rotate(${tilt}deg)` }}
        role="img"
        aria-label={`Part de responsabilité : ${meName} ${me} %, ${otherName} ${other} %`}
      >
        <div className="flex items-center bg-me px-4 text-white" style={{ width: `${Math.min(Math.max(me, 22), 78)}%` }}>
          {me}&nbsp;%
        </div>
        <div className="flex flex-1 items-center justify-end bg-other px-4 text-[#17142e]">{other}&nbsp;%</div>
      </div>
      <div className="mt-4 flex justify-between text-sm font-semibold">
        <span>{meName}</span>
        <span>{otherName}</span>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-7">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ToneBars({ tone, color }: { tone: Tone; color: "me" | "other" }) {
  return (
    <dl className="space-y-2.5">
      {TONE_ROWS.map((row) => (
        <div key={row.key}>
          <dt className="flex justify-between text-sm">
            <span className="font-semibold">{row.label}</span>
            <span className="text-muted">{Math.round(tone[row.key])}/10</span>
          </dt>
          <dd className="mt-1 h-2 rounded-full bg-line" title={row.hint}>
            <div
              className={`h-2 rounded-full ${color === "me" ? "bg-me" : "bg-other"}`}
              style={{ width: `${tone[row.key] * 10}%` }}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-sm font-semibold text-me underline underline-offset-2"
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

function Help() {
  return (
    <ul className="mt-3 space-y-1 text-[0.95rem]">
      <li>
        <strong>17 ou 112</strong> : danger immédiat
      </li>
      <li>
        <strong>3919</strong> : violences dans le couple ou la famille, gratuit, 24 h/24
      </li>
      <li>
        <strong>3018</strong> : harcèlement et violences en ligne
      </li>
      <li>
        <strong>3114</strong> : prévention du suicide, 24 h/24
      </li>
    </ul>
  );
}

export function VerdictView({ v }: { v: Verdict }) {
  const serious = v.alert.level === "serious";
  return (
    <article className="space-y-7">
      <header>
        <h1 className="text-4xl font-extrabold sm:text-5xl">{v.title}</h1>
        <p className="mt-4 text-lg">{v.summary}</p>
      </header>

      {v.alert.level !== "none" && (
        <div
          role="alert"
          className={`rounded-2xl p-5 ${serious ? "bg-alert-soft text-ink" : "border-[1.5px] border-line bg-surface"}`}
        >
          <h2 className={`text-xl font-bold ${serious ? "text-alert" : ""}`}>
            {serious ? "Cette conversation dépasse la simple dispute" : "Un point à surveiller"}
          </h2>
          <p className="mt-2">{v.alert.message}</p>
          {serious && (
            <>
              <p className="mt-3 text-[0.95rem]">
                Verdikt ne répartit pas les torts dans ce genre de situation. Si tu es concerné·e, tu peux en parler à
                quelqu'un :
              </p>
              <Help />
            </>
          )}
        </div>
      )}

      {v.responsibility && (
        <section aria-label="Verdict">
          <Balance me={v.responsibility.me} other={v.responsibility.other} meName={v.me_name} otherName={v.other_name} />
          <p>{v.responsibility.explanation}</p>
          <p className="mt-3 text-sm text-muted">
            {CONFIDENCE[v.confidence]} {v.missing_context}
          </p>
        </section>
      )}

      <Section title="Le ton de chacun">
        <div className="grid gap-6 sm:grid-cols-2">
          {(["me", "other"] as const).map((who) => (
            <div key={who}>
              <h3 className="mb-3 text-lg font-bold">{who === "me" ? v.me_name : v.other_name}</h3>
              <ToneBars tone={v.tone[who]} color={who} />
              <p className="mt-3 text-[0.95rem] text-muted">{v.tone[who].comment}</p>
            </div>
          ))}
        </div>
      </Section>

      {v.key_moments.length > 0 && (
        <Section title="Les messages qui ont tout changé">
          <ul className="space-y-5">
            {v.key_moments.map((m, i) => (
              <li key={i} className="flex flex-col gap-1.5">
                <p className={`bubble ${m.author === "me" ? "bubble-me" : "bubble-other"}`}>{m.quote}</p>
                <p className={`max-w-[85%] text-[0.95rem] ${m.author === "me" ? "ml-auto text-right" : ""}`}>
                  <strong>{KIND[m.kind]}.</strong> {m.explanation}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {v.rewrites.length > 0 && (
        <Section title="Comment tu aurais pu le dire">
          <ul className="space-y-6">
            {v.rewrites.map((r, i) => (
              <li key={i}>
                <p className="text-muted line-through decoration-1">{r.original}</p>
                <p className="mt-1 text-[0.95rem]">{r.issue}</p>
                <div className="mt-2 rounded-2xl bg-me-soft p-4">
                  <p className="font-medium">{r.better}</p>
                  <div className="mt-2 text-right">
                    <CopyButton text={r.better} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {v.draft && (
        <Section title="Ta réponse avant de l'envoyer">
          <p>{v.draft.reception}</p>
          {v.draft.risks.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {v.draft.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 rounded-2xl bg-me-soft p-4">
            <p className="text-sm font-semibold text-muted">Version conseillée</p>
            <p className="mt-1 font-medium whitespace-pre-wrap">{v.draft.improved}</p>
            <div className="mt-2 text-right">
              <CopyButton text={v.draft.improved} />
            </div>
          </div>
        </Section>
      )}

      {(v.strengths.length > 0 || v.advice.length > 0) && (
        <Section title="Pour la suite">
          {v.strengths.length > 0 && (
            <>
              <h3 className="text-lg font-bold">Ce que tu as bien fait</h3>
              <ul className="mt-2 mb-5 list-disc space-y-1 pl-5">
                {v.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          {v.advice.length > 0 && (
            <>
              <h3 className="text-lg font-bold">Ce que tu peux faire maintenant</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {v.advice.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      {!v.responsibility && !serious && (
        <p className="text-sm text-muted">
          {CONFIDENCE[v.confidence]} {v.missing_context}
        </p>
      )}
    </article>
  );
}
