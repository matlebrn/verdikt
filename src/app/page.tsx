import Link from "next/link";
import { Balance } from "@/components/verdict";
import { GUEST_LIMIT, USER_LIMIT } from "@/lib/config";
import { SAMPLE_MESSAGES, SAMPLE_VERDICT } from "@/lib/sample";

const WAYS = [
  {
    title: "Des captures d'écran",
    text: "Le plus rapide. Tes messages sont reconnus : ce sont ceux de droite.",
    tint: "bg-me-soft text-me",
    icon: "M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm3 15h4",
  },
  {
    title: "L'export de la conversation",
    text: "Le fichier texte de WhatsApp, ou un copier-coller depuis n'importe quelle appli.",
    tint: "bg-other-soft text-other",
    icon: "M6 3h8l4 4v14H6V3zm8 0v4h4M9 12h6M9 16h6",
  },
  {
    title: "La saisie à la main",
    text: "Tu retapes les messages un par un, pour un échange court ou une discussion à l'oral.",
    tint: "bg-good-soft text-good",
    icon: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  },
];

const RESULTS: [string, string][] = [
  ["chip-me", "La part de responsabilité de chacun, avec les messages qui la justifient."],
  ["chip-other", "Le ton de chacun : attaque, défensive, écoute, clarté."],
  ["chip-alert", "Le message précis où la discussion a dérapé."],
  ["chip-good", "Tes messages reformulés dans ta façon d'écrire, prêts à copier."],
  ["chip-warn", "Un avis sur ta réponse avant que tu l'envoies."],
];

export default function Home() {
  const v = SAMPLE_VERDICT;
  return (
    <div className="pt-6 sm:pt-12">
      <p className="chip chip-me">Analyse de conversation par IA</p>
      <h1 className="mt-4 text-5xl font-extrabold sm:text-7xl">Qui a tort dans cette conversation ?</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Envoie l'échange. Verdikt le lit message par message, répartit les torts, et te montre comment tu aurais pu le
        dire autrement.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link href="/analyser" className="btn btn-primary">
          Analyser une conversation
        </Link>
        <span className="text-sm text-muted">Gratuit, sans compte, {GUEST_LIMIT} analyses par jour</span>
      </div>

      <section aria-label="Exemple d'analyse" className="card mt-12">
        <div className="flex flex-col gap-2">
          {SAMPLE_MESSAGES.map((m, i) => (
            <p key={i} className={`bubble ${m.author === "me" ? "bubble-me" : "bubble-other"}`}>
              {m.text}
            </p>
          ))}
        </div>
        <div className="mt-6 border-t border-line pt-4">
          <Balance me={v.responsibility!.me} other={v.responsibility!.other} meName="Toi" otherName={v.other_name} />
          <p>{v.responsibility!.explanation}</p>
          <div className="mt-5 rounded-2xl bg-me-soft p-4">
            <p className="text-muted line-through decoration-alert decoration-2">{v.rewrites[0].original}</p>
            <p className="mt-1.5 font-medium">{v.rewrites[0].better}</p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-bold">Trois façons d'envoyer l'échange</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {WAYS.map((w) => (
            <li key={w.title} className="card">
              <span className={`badge ${w.tint}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={w.icon} />
                </svg>
              </span>
              <h3 className="mt-4 text-xl font-bold">{w.title}</h3>
              <p className="mt-2 text-[0.95rem] text-muted">{w.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-14">
        <h2 className="text-3xl font-bold">Ce que tu obtiens</h2>
        <ul className="mt-5 space-y-3">
          {RESULTS.map(([chip, text], i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`chip ${chip} mt-0.5 h-6 w-6 justify-center p-0!`} aria-hidden>
                ✓
              </span>
              {text}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-6">
          <Link href="/analyser" className="btn btn-primary">
            Analyser une conversation
          </Link>
          <span className="text-sm text-muted">
            {GUEST_LIMIT} analyses par jour sans compte, {USER_LIMIT} avec un compte et un historique.
          </span>
        </div>
      </section>
    </div>
  );
}
