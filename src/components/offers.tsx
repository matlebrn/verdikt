"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PLANS, PLUS_PRICE, type PlanId } from "@/lib/config";
import { authHeaders, useAuth } from "./auth";

type Row = { label: string; guest: string; free: string; plus: string };

const ROWS: Row[] = [
  { label: "Analyses par jour", guest: `${PLANS.guest.analyses}`, free: `${PLANS.free.analyses}`, plus: `${PLANS.plus.analyses}` },
  { label: "Questions au coach par jour", guest: `${PLANS.guest.questions}`, free: `${PLANS.free.questions}`, plus: `${PLANS.plus.questions}` },
  { label: "Captures par analyse", guest: `${PLANS.guest.images}`, free: `${PLANS.free.images}`, plus: `${PLANS.plus.images}` },
  { label: "Verdict, ton, moments clés", guest: "✓", free: "✓", plus: "✓" },
  { label: "Réponses prêtes à envoyer", guest: "✓", free: "✓", plus: "✓" },
  { label: "Avis sur ta réponse avant envoi", guest: "✓", free: "✓", plus: "✓" },
  { label: "Historique des analyses", guest: "—", free: "✓", plus: "✓" },
  { label: "Analyse approfondie", guest: "—", free: "—", plus: "✓" },
  { label: "Longues conversations", guest: "—", free: "—", plus: "✓" },
];

const PLUS_POINTS = [
  `${PLANS.plus.analyses} analyses par jour et ${PLANS.plus.questions} questions au coach`,
  "Analyse approfondie : l'IA prend plus de temps pour peser chaque message",
  `Jusqu'à ${PLANS.plus.images} captures d'écran par analyse`,
  "Les longues conversations exportées sont lues en entier",
];

export function Offers() {
  const { session, loading } = useAuth();
  const [plan, setPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/quota", { headers: await authHeaders() }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (!cancelled && data?.plan in PLANS) setPlan(data.plan);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  return (
    <div className="pt-4">
      <p className="chip chip-me">Offres</p>
      <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Gratuit pour une dispute, Verdikt+ pour tous les jours.</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Le verdict complet est gratuit. Verdikt+ ajoute du volume et une lecture plus fine des conversations.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="card">
          <h2 className="text-2xl font-bold">Gratuit</h2>
          <p className="mt-1 font-display text-3xl font-extrabold">0 €</p>
          <p className="mt-3 text-[0.95rem] text-muted">
            Sans compte : {PLANS.guest.analyses} analyses par jour. Avec un compte gratuit : {PLANS.free.analyses} analyses
            par jour, {PLANS.free.questions} questions au coach et ton historique.
          </p>
          <div className="mt-5">
            {plan === "free" ? (
              <span className="chip chip-good">Ton offre actuelle</span>
            ) : plan === "guest" && !loading && !session ? (
              <Link href="/connexion" className="btn btn-ghost w-full">
                Créer un compte gratuit
              </Link>
            ) : (
              <Link href="/analyser" className="btn btn-ghost w-full">
                Analyser une conversation
              </Link>
            )}
          </div>
        </section>

        <section className="card plus-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Verdikt+</h2>
            <span className="chip chip-warn">Le plus complet</span>
          </div>
          <p className="mt-1 font-display text-3xl font-extrabold">
            {PLUS_PRICE.month} <span className="text-base font-semibold text-muted">/ mois</span>
          </p>
          <p className="text-sm text-muted">
            ou {PLUS_PRICE.year} par an, soit {PLUS_PRICE.yearPerMonth} par mois
          </p>
          <ul className="mt-4 space-y-2">
            {PLUS_POINTS.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span className="mt-0.5 text-me" aria-hidden>
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            {plan === "plus" ? (
              <span className="chip chip-good">Ton offre actuelle</span>
            ) : (
              <>
                <button type="button" className="btn btn-primary w-full" disabled>
                  Paiement bientôt disponible
                </button>
                <p className="mt-2 text-sm text-muted">
                  L'abonnement ouvre très bientôt.
                  {!session && " Crée un compte gratuit dès maintenant pour le recevoir sur ton compte."}
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-x-auto">
        <h2 className="mb-4 text-xl font-bold">Comparer</h2>
        <table className="w-full min-w-[30rem] text-left text-[0.95rem]">
          <thead>
            <tr className="border-b border-line text-sm text-muted">
              <th className="py-2 pr-3 font-semibold">&nbsp;</th>
              <th className="py-2 pr-3 font-semibold">Sans compte</th>
              <th className="py-2 pr-3 font-semibold">Gratuit</th>
              <th className="py-2 font-semibold text-me">Verdikt+</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-b border-line last:border-0">
                <th scope="row" className="py-2.5 pr-3 font-medium">
                  {r.label}
                </th>
                <td className="py-2.5 pr-3 text-muted">{r.guest}</td>
                <td className="py-2.5 pr-3">{r.free}</td>
                <td className="py-2.5 font-semibold text-me">{r.plus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
