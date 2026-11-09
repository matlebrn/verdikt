import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";
import { AuthProvider } from "@/components/auth";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: { default: "Verdikt — qui a tort dans cette conversation ?", template: "%s — Verdikt" },
  description:
    "Envoie des captures d'écran, un export ou tape les messages : Verdikt analyse l'échange, dit qui a tort et pourquoi, et t'aide à mieux formuler.",
  appleWebApp: { capable: true, title: "Verdikt", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1effa" },
    { media: "(prefers-color-scheme: dark)", color: "#121022" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6">{children}</main>
          <footer className="mx-auto w-full max-w-3xl px-4 pb-8 text-sm text-muted sm:px-6">
            <p>
              Verdikt lit un extrait, pas toute une relation. Son avis aide à prendre du recul, il ne remplace ni une
              discussion ni un professionnel.{" "}
              <Link href="/confidentialite" className="underline underline-offset-2">
                Confidentialité
              </Link>
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
