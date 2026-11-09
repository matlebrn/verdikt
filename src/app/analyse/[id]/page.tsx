"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { VerdictView } from "@/components/verdict";
import { supabase } from "@/lib/supabase";
import { resultSchema, type Verdict } from "@/lib/types";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { session, loading } = useAuth();
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [missing, setMissing] = useState(false);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("analyses")
      .select("result")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const parsed = resultSchema.safeParse(data?.result);
        if (parsed.success) setVerdict(parsed.data);
        else setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  if (loading) return <p className="pt-8 text-muted">Chargement…</p>;

  if (!session || missing) {
    return (
      <div className="pt-4">
        <h1 className="text-4xl font-extrabold">Analyse introuvable</h1>
        <p className="mt-4">
          {session ? "Elle a été supprimée, ou elle appartient à un autre compte." : "Connecte-toi pour ouvrir cette analyse."}
        </p>
        <Link href={session ? "/historique" : "/connexion"} className="btn btn-primary mt-5">
          {session ? "Retour à l'historique" : "Se connecter"}
        </Link>
      </div>
    );
  }

  if (!verdict) return <p className="pt-8 text-muted">Chargement…</p>;

  return (
    <div className="pt-4">
      <VerdictView v={verdict} />
      <div className="mt-10 border-t border-line pt-6">
        <Link href="/historique" className="btn btn-ghost">
          Retour à l'historique
        </Link>
      </div>
    </div>
  );
}
