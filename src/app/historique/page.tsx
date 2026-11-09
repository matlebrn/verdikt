"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";

type Row = { id: string; title: string; created_at: string; me: number | null; other: number | null; level: string | null };

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function Page() {
  const { session, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("analyses")
      .select("id, title, created_at, me:result->responsibility->me, other:result->responsibility->other, level:result->alert->>level")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError("Impossible de charger ton historique. Recharge la page.");
        else setRows(data as unknown as Row[]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function remove(id: string) {
    if (!window.confirm("Supprimer cette analyse ?")) return;
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) setError("La suppression a échoué. Réessaie.");
    else setRows((cur) => cur?.filter((r) => r.id !== id) ?? null);
  }

  if (loading) return <p className="pt-8 text-muted">Chargement…</p>;

  if (!session) {
    return (
      <div className="pt-4">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Historique</h1>
        <p className="mt-4">Connecte-toi pour retrouver tes analyses.</p>
        <Link href="/connexion" className="btn btn-primary mt-5">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Historique</h1>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-alert-soft px-4 py-3 font-medium">
          {error}
        </p>
      )}
      {!rows && !error && <p className="mt-6 text-muted">Chargement…</p>}
      {rows?.length === 0 && (
        <div className="mt-6">
          <p>Aucune analyse pour l'instant. Les prochaines s'enregistrent ici.</p>
          <Link href="/analyser" className="btn btn-primary mt-5">
            Analyser une conversation
          </Link>
        </div>
      )}
      {rows && rows.length > 0 && (
        <ul className="card mt-6 divide-y divide-line py-1!">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-4">
              <Link href={`/analyse/${r.id}`} className="min-w-0 flex-1">
                <span className="block truncate font-display text-xl font-bold">{r.title}</span>
                <span className="text-sm text-muted">
                  {dateFormat.format(new Date(r.created_at))}
                  {r.level === "serious"
                    ? ", situation signalée"
                    : r.me != null && r.other != null && `, toi ${r.me} %, l'autre ${r.other} %`}
                </span>
              </Link>
              <button type="button" className="shrink-0 text-sm text-muted underline underline-offset-2 hover:text-alert" onClick={() => remove(r.id)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
