"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth";

export function Header() {
  const { session, loading } = useAuth();
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={path === href ? "page" : undefined}
      className="rounded-full px-3 py-2 text-[0.95rem] font-medium text-muted hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink"
    >
      {label}
    </Link>
  );

  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
        Verdikt
      </Link>
      <nav className="flex items-center gap-1" aria-label="Navigation principale">
        {link("/analyser", "Analyser")}
        {session && link("/historique", "Historique")}
        {!loading && link("/connexion", session ? "Compte" : "Connexion")}
      </nav>
    </header>
  );
}
