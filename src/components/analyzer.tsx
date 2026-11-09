"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MAX_IMAGES, MAX_MANUAL_MESSAGES, MAX_TEXT_CHARS } from "@/lib/config";
import { RELATION_LABELS, RELATIONS, type AnalyzeRequest, type AnalyzeResponse, type InputMode } from "@/lib/types";
import { authHeaders, useAuth } from "./auth";
import { VerdictView } from "./verdict";

type Img = { media_type: "image/jpeg"; data: string; preview: string };
type Msg = { author: "me" | "other"; text: string };

const MODES: { id: InputMode; label: string }[] = [
  { id: "captures", label: "Captures d'écran" },
  { id: "export", label: "Export de la conversation" },
  { id: "manuel", label: "Saisie à la main" },
];

/** Réduit une capture avant envoi : plus rapide, et rien d'inutile ne quitte le téléphone. */
async function shrink(file: File): Promise<Img> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.82);
  return { media_type: "image/jpeg", data: url.split(",")[1], preview: url };
}

export function Analyzer() {
  const { session } = useAuth();
  const [mode, setMode] = useState<InputMode>("captures");
  const [images, setImages] = useState<Img[]>([]);
  const [text, setText] = useState("");
  const [meName, setMeName] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [line, setLine] = useState("");
  const [relation, setRelation] = useState<(typeof RELATIONS)[number] | "">("");
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/quota", { headers: await authHeaders() }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (!cancelled && data && typeof data.remaining === "number") setQuota(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  async function addImages(files: FileList | null) {
    if (!files) return;
    setError(null);
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setNotice(`${MAX_IMAGES} captures maximum : les suivantes n'ont pas été ajoutées.`);
    try {
      const next = await Promise.all(picked.map(shrink));
      setImages((cur) => [...cur, ...next]);
    } catch {
      setError("Une de ces images n'a pas pu être lue. Essaie avec une capture au format PNG ou JPEG.");
    }
  }

  async function loadExport(file: File | undefined) {
    if (!file) return;
    const raw = await file.text();
    if (raw.length > MAX_TEXT_CHARS) {
      setText(raw.slice(-MAX_TEXT_CHARS));
      setNotice("Conversation très longue : seule la partie la plus récente a été gardée.");
    } else {
      setText(raw);
    }
  }

  function addMessage(author: Msg["author"]) {
    const t = line.trim();
    if (!t || messages.length >= MAX_MANUAL_MESSAGES) return;
    setMessages((cur) => [...cur, { author, text: t }]);
    setLine("");
    lineRef.current?.focus();
  }

  const ready =
    mode === "captures"
      ? images.length > 0
      : mode === "export"
        ? text.trim().length >= 20 && meName.trim().length > 0
        : messages.length >= 2;

  async function submit() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const common = {
      relation: relation || undefined,
      context: context.trim() || undefined,
      draft: draft.trim() || undefined,
    };
    const body: AnalyzeRequest =
      mode === "captures"
        ? { mode, images: images.map(({ media_type, data }) => ({ media_type, data })), ...common }
        : mode === "export"
          ? { mode, text: text.slice(-MAX_TEXT_CHARS), meName: meName.trim(), ...common }
          : { mode, messages, ...common };
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (typeof data?.remaining === "number") setQuota({ remaining: data.remaining, limit: data.limit });
      if (!res.ok || !data?.result) {
        setError(data?.error || "L'analyse n'a pas abouti. Réessaie dans un instant.");
        return;
      }
      setResponse(data as AnalyzeResponse);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  if (response) {
    return (
      <div ref={resultRef} className="pt-4">
        <VerdictView v={response.result} />
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button type="button" className="btn btn-primary" onClick={() => setResponse(null)}>
            Analyser une autre conversation
          </button>
          {response.id ? (
            <Link href="/historique" className="btn btn-ghost">
              Voir mon historique
            </Link>
          ) : (
            !session && (
              <p className="text-sm text-muted">
                Cette analyse n'est pas enregistrée.{" "}
                <Link href="/connexion" className="underline underline-offset-2">
                  Crée un compte
                </Link>{" "}
                pour garder les prochaines.
              </p>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Quelle conversation on regarde ?</h1>

      <div role="tablist" aria-label="Façon d'envoyer la conversation" className="mt-7 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className="rounded-full border-[1.5px] border-line px-4 py-2 font-semibold aria-selected:border-ink aria-selected:bg-ink aria-selected:text-bg"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-5">
        {mode === "captures" && (
          <div>
            <p className="text-muted">
              Jusqu'à {MAX_IMAGES} captures, dans l'ordre. Tes messages sont ceux de droite.
            </p>
            {images.length > 0 && (
              <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <li key={i} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={`Capture ${i + 1}`} className="h-44 rounded-xl border border-line" />
                    <button
                      type="button"
                      aria-label={`Retirer la capture ${i + 1}`}
                      onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))}
                      className="absolute top-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-full bg-ink text-lg leading-none text-bg"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {images.length < MAX_IMAGES && (
              <label className="btn btn-ghost mt-4 cursor-pointer">
                {images.length ? "Ajouter des captures" : "Choisir des captures"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addImages(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        )}

        {mode === "export" && (
          <div className="space-y-4">
            <p className="text-muted">
              Dans WhatsApp : ouvre la discussion, puis Exporter la discussion, sans les médias. Tu peux aussi coller
              le texte directement.
            </p>
            <label className="btn btn-ghost cursor-pointer">
              Choisir le fichier .txt
              <input
                type="file"
                accept=".txt,text/plain"
                className="sr-only"
                onChange={(e) => {
                  loadExport(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <div>
              <label htmlFor="export-text" className="mb-1.5 block font-semibold">
                Conversation
              </label>
              <textarea
                id="export-text"
                className="field min-h-48 text-[0.95rem]"
                value={text}
                maxLength={MAX_TEXT_CHARS}
                onChange={(e) => setText(e.target.value)}
                placeholder={"[09/11/2026 20:14] Camille : T'es où ?\n[09/11/2026 20:15] Matéo : J'arrive"}
              />
            </div>
            <div>
              <label htmlFor="me-name" className="mb-1.5 block font-semibold">
                Ton nom tel qu'il apparaît dans la conversation
              </label>
              <input
                id="me-name"
                className="field"
                value={meName}
                maxLength={60}
                onChange={(e) => setMeName(e.target.value)}
              />
            </div>
          </div>
        )}

        {mode === "manuel" && (
          <div>
            <p className="text-muted">Tape chaque message, puis indique qui l'a envoyé.</p>
            {messages.length > 0 && (
              <ol className="mt-4 flex flex-col gap-2">
                {messages.map((m, i) => (
                  <li key={i} className={`flex items-center gap-2 ${m.author === "me" ? "flex-row-reverse" : ""}`}>
                    <p className={`bubble ${m.author === "me" ? "bubble-me" : "bubble-other"} !m-0`}>{m.text}</p>
                    <button
                      type="button"
                      aria-label="Supprimer ce message"
                      onClick={() => setMessages((cur) => cur.filter((_, j) => j !== i))}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-muted hover:text-ink"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-4">
              <label htmlFor="line" className="sr-only">
                Message
              </label>
              <input
                id="line"
                ref={lineRef}
                className="field"
                value={line}
                maxLength={2000}
                onChange={(e) => setLine(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const last = messages.at(-1)?.author;
                    addMessage(last === "other" || !last ? "me" : "other");
                  }
                }}
                placeholder="Écris un message…"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="btn flex-1 bg-other-soft text-ink"
                  disabled={!line.trim()}
                  onClick={() => addMessage("other")}
                >
                  Envoyé par l'autre
                </button>
                <button
                  type="button"
                  className="btn flex-1 bg-me text-white"
                  disabled={!line.trim()}
                  onClick={() => addMessage("me")}
                >
                  Envoyé par moi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-9 space-y-5 border-t border-line pt-7">
        <fieldset>
          <legend className="mb-2 font-semibold">
            C'est une conversation avec… <span className="font-normal text-muted">(facultatif)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {RELATIONS.map((r) => (
              <label
                key={r}
                className="cursor-pointer rounded-full border-[1.5px] border-line px-3.5 py-1.5 has-checked:border-me has-checked:bg-me-soft has-focus-visible:outline-3 has-focus-visible:outline-me"
              >
                <input
                  type="radio"
                  name="relation"
                  className="sr-only"
                  checked={relation === r}
                  onChange={() => setRelation(r)}
                  onClick={() => relation === r && setRelation("")}
                />
                {RELATION_LABELS[r]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="context" className="mb-1.5 block font-semibold">
            Ce qu'il faut savoir avant de lire <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <textarea
            id="context"
            className="field min-h-20"
            value={context}
            maxLength={1500}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ex. : on s'était déjà disputés la veille sur le même sujet."
          />
        </div>

        <div>
          <label htmlFor="draft" className="mb-1.5 block font-semibold">
            Ta réponse pas encore envoyée <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <textarea
            id="draft"
            className="field min-h-20"
            value={draft}
            maxLength={3000}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Colle ton brouillon : Verdikt te dit comment il sera reçu."
          />
        </div>
      </div>

      <div className="mt-7" aria-live="polite">
        {notice && <p className="mb-3 text-[0.95rem] text-muted">{notice}</p>}
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-alert-soft px-4 py-3 font-medium">
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={!ready || busy} onClick={submit}>
          {busy ? "Lecture de la conversation…" : "Analyser la conversation"}
        </button>
        {quota && (
          <p className="mt-3 text-sm text-muted">
            {quota.remaining > 0
              ? `Il te reste ${quota.remaining} analyse${quota.remaining > 1 ? "s" : ""} sur ${quota.limit} aujourd'hui.`
              : "Tu as utilisé toutes tes analyses du jour."}
            {!session && (
              <>
                {" "}
                <Link href="/connexion" className="underline underline-offset-2">
                  Avec un compte : 10 par jour et un historique.
                </Link>
              </>
            )}
          </p>
        )}
        <p className="mt-2 text-sm text-muted">
          La conversation est envoyée à l'IA pour être lue, puis n'est pas conservée par Verdikt.
        </p>
      </div>
    </div>
  );
}
