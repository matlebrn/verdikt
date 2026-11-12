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
      className="rounded-full px-3 py-2 text-[0.95rem] font-semibold text-muted hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-me aria-[current=page]:shadow-sm"
    >
      {label}
    </Link>
  );

  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
        <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
          <defs>
            <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5b3df5" />
              <stop offset="1" stopColor="#a04bff" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#logo)" />
          <path d="M14 18h12l6 18 6-18h12L38 46H26z" fill="#fff" />
          <rect x="12" y="51" width="40" height="5" rx="2.5" fill="#ff8a3d" transform="rotate(-6 32 53)" />
        </svg>
        Verdikt
      </Link>
      <nav className="flex items-center gap-1" aria-label="Navigation principale">
        {link("/analyser", "Analyser")}
        {link("/offres", "Offres")}
        {session && link("/historique", "Historique")}
        {!loading && link("/connexion", session ? "Compte" : "Connexion")}
      </nav>
    </header>
  );
}
