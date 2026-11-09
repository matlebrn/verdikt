import Link from "next/link";
import { Balance } from "@/components/verdict";
import { GUEST_LIMIT, USER_LIMIT } from "@/lib/config";
import { SAMPLE_MESSAGES, SAMPLE_VERDICT } from "@/lib/sample";

export default function Home() {
  const v = SAMPLE_VERDICT;
  return (
    <div className="pt-6 sm:pt-12">
      <h1 className="text-5xl font-extrabold sm:text-7xl">Qui a tort dans cette conversation ?</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Envoie l'échange. Verdikt le lit message par message, répartit les torts, et te montre comment tu aurais pu le
        dire autrement.
      </p>
      <Link href="/analyser" className="btn btn-primary mt-7">
        Analyser une conversation
      </Link>

      <section aria-label="Exemple d'analyse" className="mt-14 rounded-3xl bg-surface p-5 sm:p-8">
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
            <p className="text-muted line-through decoration-1">{v.rewrites[0].original}</p>
            <p className="mt-1.5 font-medium">{v.rewrites[0].better}</p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-bold">Trois façons d'envoyer l'échange</h2>
        <dl className="mt-5 space-y-4">
          <div>
            <dt className="font-bold">Des captures d'écran</dt>
            <dd className="text-muted">Le plus rapide. Verdikt reconnaît tes messages : ce sont ceux de droite.</dd>
          </div>
          <div>
            <dt className="font-bold">L'export de la conversation</dt>
            <dd className="text-muted">Le fichier texte de WhatsApp, ou un copier-coller depuis n'importe quelle appli.</dd>
          </div>
          <div>
            <dt className="font-bold">La saisie à la main</dt>
            <dd className="text-muted">Tu retapes les messages un par un, pour un échange court ou une discussion à l'oral.</dd>
          </div>
        </dl>
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-bold">Ce que tu obtiens</h2>
        <ul className="mt-5 list-disc space-y-2 pl-5">
          <li>La part de responsabilité de chacun, avec les messages qui la justifient.</li>
          <li>Ton ton et celui de l'autre : attaque, défensive, écoute, clarté.</li>
          <li>Le message précis où la discussion a dérapé.</li>
          <li>Tes messages reformulés, prêts à copier.</li>
          <li>Un avis sur ta réponse avant que tu l'envoies.</li>
        </ul>
        <p className="mt-5 text-muted">
          Gratuit : {GUEST_LIMIT} analyses par jour sans compte, {USER_LIMIT} avec un compte et un historique.
        </p>
      </section>
    </div>
  );
}
