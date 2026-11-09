"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";

type View = "login" | "signup" | "forgot";

function translate(message: string): string {
  if (/invalid login/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/already registered/i.test(message)) return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
  if (/not confirmed/i.test(message)) return "Confirme d'abord ton e-mail avec le lien que tu as reçu.";
  if (/at least|weak|password should/i.test(message)) return "Mot de passe trop court : 8 caractères minimum.";
  if (/rate limit|too many|security purposes/i.test(message)) return "Trop de tentatives. Patiente une minute et réessaie.";
  if (/different from the old/i.test(message)) return "Choisis un mot de passe différent de l'ancien.";
  return "Ça n'a pas fonctionné. Vérifie tes informations et réessaie.";
}

export default function Page() {
  const { session, loading, recovery } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  async function run(fn: () => Promise<string | null | void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const failure = await fn();
      if (failure) setError(translate(failure));
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const origin = window.location.origin;
    run(async () => {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        router.push("/analyser");
      } else if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/analyser` },
        });
        if (error) return error.message;
        if (data.session) router.push("/analyser");
        else setInfo("Compte créé. Ouvre le lien reçu par e-mail pour l'activer.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/connexion` });
        if (error) return error.message;
        setInfo("Si un compte existe avec cet e-mail, un lien pour changer de mot de passe vient d'être envoyé.");
      }
    });
  }

  const feedback = (
    <div aria-live="polite">
      {error && (
        <p role="alert" className="rounded-xl bg-alert-soft px-4 py-3 font-medium">
          {error}
        </p>
      )}
      {info && <p className="rounded-xl bg-me-soft px-4 py-3 font-medium">{info}</p>}
    </div>
  );

  if (loading) return <p className="pt-8 text-muted">Chargement…</p>;

  if (session && recovery && !passwordChanged) {
    return (
      <form
        className="card mx-auto mt-4 max-w-md space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) return error.message;
            setPasswordChanged(true);
            setPassword("");
            setInfo("Mot de passe changé.");
          });
        }}
      >
        <h1 className="text-4xl font-extrabold">Choisis un nouveau mot de passe</h1>
        <div>
          <label htmlFor="new-password" className="mb-1.5 block font-semibold">
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            type="password"
            className="field"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {feedback}
        <button className="btn btn-primary" disabled={busy}>
          Changer le mot de passe
        </button>
      </form>
    );
  }

  if (session) {
    return (
      <div className="card mx-auto mt-4 max-w-md space-y-5">
        <h1 className="text-4xl font-extrabold">Ton compte</h1>
        <p>
          Connecté avec <strong>{session.user.email}</strong>
        </p>
        {feedback}
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => void (await supabase.auth.signOut()))}>
            Se déconnecter
          </button>
        </div>
        <div className="border-t border-line pt-5">
          <h2 className="text-xl font-bold">Supprimer mon compte</h2>
          <p className="mt-1 text-muted">Ton compte et tout ton historique sont effacés définitivement.</p>
          <button
            className="btn btn-ghost mt-3 border-alert! text-alert!"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Supprimer définitivement ton compte et ton historique ?")) return;
              run(async () => {
                const { error } = await supabase.rpc("delete_my_account");
                if (error) return error.message;
                await supabase.auth.signOut({ scope: "local" });
                router.push("/");
              });
            }}
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    );
  }

  const titles: Record<View, string> = {
    login: "Connexion",
    signup: "Créer un compte",
    forgot: "Mot de passe oublié",
  };
  const actions: Record<View, string> = {
    login: "Se connecter",
    signup: "Créer mon compte",
    forgot: "Recevoir le lien",
  };

  return (
    <form className="card mx-auto mt-4 max-w-md space-y-4" onSubmit={onSubmit}>
      <h1 className="text-4xl font-extrabold">{titles[view]}</h1>
      {view === "signup" && <p className="text-muted">10 analyses par jour et un historique de tes analyses.</p>}
      <div>
        <label htmlFor="email" className="mb-1.5 block font-semibold">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          className="field"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {view !== "forgot" && (
        <div>
          <label htmlFor="password" className="mb-1.5 block font-semibold">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            className="field"
            required
            minLength={8}
            autoComplete={view === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {view === "signup" && <p className="mt-1 text-sm text-muted">8 caractères minimum.</p>}
        </div>
      )}
      {feedback}
      <button className="btn btn-primary w-full" disabled={busy}>
        {actions[view]}
      </button>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem]">
        {view !== "login" && (
          <button type="button" className="underline underline-offset-2" onClick={() => setView("login")}>
            J'ai déjà un compte
          </button>
        )}
        {view !== "signup" && (
          <button type="button" className="underline underline-offset-2" onClick={() => setView("signup")}>
            Créer un compte
          </button>
        )}
        {view === "login" && (
          <button type="button" className="underline underline-offset-2" onClick={() => setView("forgot")}>
            Mot de passe oublié
          </button>
        )}
      </div>
    </form>
  );
}
