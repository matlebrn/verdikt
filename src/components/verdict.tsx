"use client";

import { useState, type ReactNode } from "react";
import type { Tone, Verdict } from "@/lib/types";

const CONFIDENCE = {
  low: { label: "Confiance faible", chip: "chip-warn", text: "L'extrait est court ou incomplet." },
  medium: { label: "Confiance moyenne", chip: "chip-me", text: "Il manque une partie du contexte." },
  high: { label: "Confiance élevée", chip: "chip-good", text: "L'échange est clair et complet." },
} as const;

const KIND = {
  escalation: { label: "Ça dérape", chip: "chip-alert" },
  calming: { label: "Ça apaise", chip: "chip-good" },
  misunderstanding: { label: "Malentendu", chip: "chip-warn" },
  turning_point: { label: "Tournant", chip: "chip-me" },
} as const;

/** Pour l'attaque et la défensive, un score haut est mauvais ; pour l'écoute et la clarté, il est bon. */
const TONE_ROWS: { key: keyof Omit<Tone, "comment">; label: string; hint: string; highIsGood: boolean }[] = [
  { key: "aggressiveness", label: "Attaque", hint: "reproches, piques, généralisations", highIsGood: false },
  { key: "defensiveness", label: "Défensive", hint: "se justifie, renvoie la faute", highIsGood: false },
  { key: "listening", label: "Écoute", hint: "tient compte de ce que dit l'autre", highIsGood: true },
  { key: "clarity", label: "Clarté", hint: "dit clairement ce qui est attendu", highIsGood: true },
];

const ICONS = {
  scale: "M12 3v18M5 21h14M5 7h14M5 7l-3 7a3 3 0 006 0L5 7zm14 0l-3 7a3 3 0 006 0l-3-7z",
  tone: "M3 12h3l3-8 4 16 3-8h5",
  moment: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  pen: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  send: "M4 12l16-8-6 16-3-7-7-1z",
  next: "M5 12h14M13 6l6 6-6 6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

/** La balance : la barre penche du côté de celui qui porte le plus de responsabilité. */
export function Balance({ me, other, meName, otherName }: { me: number; other: number; meName: string; otherName: string }) {
  const tilt = Math.max(-5, Math.min(5, (other - me) / 10));
  return (
    <div className="py-5">
      <div
        className="balance flex h-16 overflow-hidden rounded-2xl font-display text-2xl font-extrabold shadow-lg"
        style={{ transform: `rotate(${tilt}deg)` }}
        role="img"
        aria-label={`Part de responsabilité : ${meName} ${me} %, ${otherName} ${other} %`}
      >
        <div
          className="flex items-center px-4 text-white"
          style={{ width: `${Math.min(Math.max(me, 22), 78)}%`, background: "linear-gradient(135deg,#5b3df5,#8a4bff)" }}
        >
          {me}&nbsp;%
        </div>
        <div
          className="flex flex-1 items-center justify-end px-4 text-[#17142e]"
          style={{ background: "linear-gradient(135deg,#ffb04d,#ff7a3d)" }}
        >
          {other}&nbsp;%
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm font-semibold">
        <span className="chip chip-me">{meName}</span>
        <span className="chip chip-other">{otherName}</span>
      </div>
    </div>
  );
}

function Section({ title, icon, tint, children }: { title: string; icon: keyof typeof ICONS; tint: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2 className="mb-5 flex items-center gap-3 text-2xl font-bold">
        <span className={`badge ${tint}`}>
          <Icon name={icon} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToneBars({ tone }: { tone: Tone }) {
  return (
    <dl className="space-y-3">
      {TONE_ROWS.map((row) => {
        const value = Math.round(tone[row.key]);
        const quality = row.highIsGood ? value : 10 - value;
        const color = quality >= 7 ? "bg-good" : quality >= 4 ? "bg-other" : "bg-alert";
        return (
          <div key={row.key}>
            <dt className="flex justify-between text-sm">
              <span className="font-semibold">
                {row.label} <span className="font-normal text-muted">· {row.hint}</span>
              </span>
              <span className="font-semibold tabular-nums">{value}/10</span>
            </dt>
            <dd className="mt-1 h-2.5 rounded-full bg-line">
              <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.max(value, 0.5) * 10}%` }} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function CopyButton({ text }: { text: string }) {
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

function Suggestion({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 rounded-2xl bg-me-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-me">{label}</p>
        <CopyButton text={text} />
      </div>
      <p className="mt-2 font-medium whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function Help() {
  const lines: [string, string][] = [
    ["17 ou 112", "danger immédiat"],
    ["3919", "violences dans le couple ou la famille, gratuit, 24 h/24"],
    ["3018", "harcèlement et violences en ligne"],
    ["3114", "prévention du suicide, 24 h/24"],
  ];
  return (
    <ul className="mt-3 space-y-1.5 text-[0.95rem]">
      {lines.map(([number, what]) => (
        <li key={number} className="flex items-baseline gap-2">
          <strong className="chip chip-alert bg-surface!">{number}</strong>
          {what}
        </li>
      ))}
    </ul>
  );
}

export function VerdictView({ v }: { v: Verdict }) {
  const serious = v.alert.level === "serious";
  const confidence = CONFIDENCE[v.confidence];
  return (
    <article className="space-y-5">
      <header className="card">
        <div className="flex flex-wrap gap-2">
          <span className={`chip ${confidence.chip}`}>{confidence.label}</span>
          {v.alert.level === "vigilance" && <span className="chip chip-warn">Point de vigilance</span>}
          {serious && <span className="chip chip-alert">Situation préoccupante</span>}
        </div>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{v.title}</h1>
        <p className="mt-4 text-lg">{v.summary}</p>

        {v.responsibility && (
          <div className="mt-2">
            <Balance me={v.responsibility.me} other={v.responsibility.other} meName={v.me_name} otherName={v.other_name} />
            <p>{v.responsibility.explanation}</p>
          </div>
        )}
        <p className="mt-4 rounded-xl bg-bg px-4 py-3 text-sm text-muted">
          <strong className="text-ink">{confidence.text}</strong> {v.missing_context}
        </p>
      </header>

      {v.alert.level !== "none" && (
        <div role="alert" className={`card ${serious ? "border-alert! bg-alert-soft!" : "border-warn! bg-warn-soft!"}`}>
          <h2 className={`flex items-center gap-3 text-xl font-bold ${serious ? "text-alert" : "text-warn"}`}>
            <span className="badge bg-surface">
              <Icon name="shield" />
            </span>
            {serious ? "Cette conversation dépasse la simple dispute" : "Un point à surveiller"}
          </h2>
          <p className="mt-3">{v.alert.message}</p>
          {serious && (
            <>
              <p className="mt-3 text-[0.95rem]">
                Verdikt ne répartit pas les torts dans ce genre de situation. Des personnes formées peuvent écouter et
                conseiller :
              </p>
              <Help />
            </>
          )}
        </div>
      )}

      <Section title="Le ton de chacun" icon="tone" tint="bg-me-soft text-me">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["me", "other"] as const).map((who) => (
            <div key={who} className="rounded-2xl border border-line p-4">
              <h3 className="mb-3">
                <span className={`chip text-base ${who === "me" ? "chip-me" : "chip-other"}`}>
                  {who === "me" ? v.me_name : v.other_name}
                </span>
              </h3>
              <ToneBars tone={v.tone[who]} />
              <p className="mt-4 text-[0.95rem]">{v.tone[who].comment}</p>
            </div>
          ))}
        </div>
      </Section>

      {v.key_moments.length > 0 && (
        <Section title="Les messages qui ont tout changé" icon="moment" tint="bg-warn-soft text-warn">
          <ul className="space-y-6">
            {v.key_moments.map((m, i) => (
              <li key={i} className={`flex flex-col gap-2 ${m.author === "me" ? "items-end" : "items-start"}`}>
                <p className={`bubble m-0! ${m.author === "me" ? "bubble-me" : "bubble-other"}`}>{m.quote}</p>
                <div className={`max-w-[90%] text-[0.95rem] ${m.author === "me" ? "text-right" : ""}`}>
                  <span className={`chip ${KIND[m.kind].chip}`}>{KIND[m.kind].label}</span>
                  <p className="mt-1.5">{m.explanation}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {v.rewrites.length > 0 && (
        <Section title="Comment tu aurais pu le dire" icon="pen" tint="bg-good-soft text-good">
          <ul className="space-y-7">
            {v.rewrites.map((r, i) => (
              <li key={i}>
                <p className="text-muted line-through decoration-alert decoration-2">{r.original}</p>
                <p className="mt-1.5 text-[0.95rem]">{r.issue}</p>
                <Suggestion label="Version conseillée" text={r.better} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {v.draft && (
        <Section title="Ta réponse avant de l'envoyer" icon="send" tint="bg-other-soft text-other">
          <p>{v.draft.reception}</p>
          {v.draft.risks.length > 0 && (
            <ul className="mt-4 space-y-2">
              {v.draft.risks.map((r, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-alert" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          )}
          <Suggestion label="Version conseillée" text={v.draft.improved} />
        </Section>
      )}

      {(v.strengths.length > 0 || v.advice.length > 0) && (
        <Section title="Pour la suite" icon="next" tint="bg-me-soft text-me">
          {v.strengths.length > 0 && (
            <>
              <h3 className="text-lg font-bold">Ce que tu as bien fait</h3>
              <ul className="mt-2 mb-6 space-y-2">
                {v.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-2 h-2 w-2 flex-none rounded-full bg-good" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </>
          )}
          {v.advice.length > 0 && (
            <>
              <h3 className="text-lg font-bold">Ce que tu peux faire maintenant</h3>
              <ul className="mt-2 space-y-2">
                {v.advice.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-2 h-2 w-2 flex-none rounded-full bg-me" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}
    </article>
  );
}
