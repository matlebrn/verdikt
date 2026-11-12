import { z } from "zod";
import { MAX_IMAGES, MAX_MANUAL_MESSAGES, MAX_TEXT_CHARS } from "./config";

/* ---------- Requête ---------- */

export const RELATIONS = ["couple", "ami", "famille", "travail", "autre"] as const;
export const RELATION_LABELS: Record<(typeof RELATIONS)[number], string> = {
  couple: "Couple",
  ami: "Ami·e",
  famille: "Famille",
  travail: "Travail",
  autre: "Autre",
};

const common = {
  relation: z.enum(RELATIONS).optional(),
  context: z.string().max(1500).optional(),
  draft: z.string().max(3000).optional(),
};

export const requestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("captures"),
    images: z
      .array(
        z.object({
          media_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
          data: z.string().min(100).max(1_400_000),
        }),
      )
      .min(1)
      .max(MAX_IMAGES),
    ...common,
  }),
  z.object({
    mode: z.literal("export"),
    text: z.string().min(20).max(MAX_TEXT_CHARS),
    meName: z.string().min(1).max(60),
    ...common,
  }),
  z.object({
    mode: z.literal("manuel"),
    messages: z
      .array(z.object({ author: z.enum(["me", "other"]), text: z.string().min(1).max(2000) }))
      .min(2)
      .max(MAX_MANUAL_MESSAGES),
    ...common,
  }),
]);

export type AnalyzeRequest = z.infer<typeof requestSchema>;
export type InputMode = AnalyzeRequest["mode"];

/* ---------- Résultat ---------- */

const score = z.number().min(0).max(10);
const toneSchema = z.object({
  aggressiveness: score,
  defensiveness: score,
  listening: score,
  clarity: score,
  comment: z.string(),
});

export const resultSchema = z.object({
  readable: z.boolean(),
  unreadable_reason: z.string().nullish(),
  title: z.string(),
  summary: z.string(),
  me_name: z.string(),
  other_name: z.string(),
  alert: z.object({
    level: z.enum(["none", "vigilance", "serious"]),
    message: z.string(),
  }),
  responsibility: z
    .object({ me: z.number().min(0).max(100), other: z.number().min(0).max(100), explanation: z.string() })
    .nullish(),
  confidence: z.enum(["low", "medium", "high"]),
  missing_context: z.string(),
  tone: z.object({ me: toneSchema, other: toneSchema }),
  key_moments: z.array(
    z.object({
      author: z.enum(["me", "other"]),
      quote: z.string(),
      kind: z.enum(["escalation", "calming", "misunderstanding", "turning_point"]),
      explanation: z.string(),
    }),
  ),
  rewrites: z.array(z.object({ original: z.string(), issue: z.string(), better: z.string() })),
  strengths: z.array(z.string()),
  advice: z.array(z.string()),
  draft: z
    .object({ reception: z.string(), risks: z.array(z.string()), improved: z.string() })
    .nullish(),
  // Ajoutés en novembre 2026 : absents des analyses plus anciennes de l'historique.
  verdict_line: z.string().optional(),
  replies: z.array(z.object({ intent: z.string(), text: z.string() })).optional(),
  transcript: z.array(z.object({ author: z.enum(["me", "other"]), text: z.string() })).optional(),
});

export type Verdict = z.infer<typeof resultSchema>;
export type Tone = z.infer<typeof toneSchema>;

export type AnalyzeResponse = {
  result: Verdict;
  remaining: number;
  limit: number;
  id: string | null;
};

/* ---------- Schéma JSON envoyé au modèle ---------- */

const toneJson = {
  type: "object",
  properties: {
    aggressiveness: { type: "number", description: "0 = aucune attaque, 10 = très agressif" },
    defensiveness: { type: "number", description: "0 = ouvert, 10 = totalement sur la défensive" },
    listening: { type: "number", description: "0 = n'écoute pas l'autre, 10 = écoute vraiment" },
    clarity: { type: "number", description: "0 = confus ou sous-entendus, 10 = dit clairement ce qu'il veut" },
    comment: { type: "string", description: "Une ou deux phrases sur sa manière de s'exprimer" },
  },
  required: ["aggressiveness", "defensiveness", "listening", "clarity", "comment"],
} as const;

export const verdictJsonSchema = {
  type: "object",
  properties: {
    readable: { type: "boolean", description: "false si ce n'est pas une conversation exploitable" },
    transcript: {
      type: "array",
      description:
        "La conversation telle que tu l'as lue, dans l'ordre, message par message (80 messages maximum : les plus récents si c'est plus long). Texte recopié tel quel, fautes comprises.",
      items: {
        type: "object",
        properties: { author: { type: "string", enum: ["me", "other"] }, text: { type: "string" } },
        required: ["author", "text"],
      },
    },
    unreadable_reason: { type: ["string", "null"] },
    title: { type: "string", description: "Titre court du désaccord (6 mots max)" },
    verdict_line: {
      type: "string",
      description:
        "Le verdict en une phrase directe adressée à l'utilisateur, qui tranche (ex. : « Sur ce coup, c'est plutôt toi qui as tort : tu as oublié le dîner et tu as contre-attaqué au lieu de t'excuser. »). Vide si alert.level = serious.",
    },
    summary: { type: "string", description: "Ce qui s'est passé, en 2 à 3 phrases" },
    me_name: { type: "string", description: "Prénom de l'utilisateur s'il est connu, sinon « Toi »" },
    other_name: { type: "string", description: "Prénom de l'autre personne s'il est connu, sinon « L'autre »" },
    alert: {
      type: "object",
      properties: {
        level: { type: "string", enum: ["none", "vigilance", "serious"] },
        message: { type: "string", description: "Vide si level = none" },
      },
      required: ["level", "message"],
    },
    responsibility: {
      type: ["object", "null"],
      description: "null si alert.level = serious",
      properties: {
        me: { type: "number", description: "Part de l'utilisateur, 0 à 100" },
        other: { type: "number", description: "Part de l'autre, 0 à 100. me + other = 100" },
        explanation: { type: "string" },
      },
      required: ["me", "other", "explanation"],
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    missing_context: { type: "string", description: "Ce que l'extrait ne permet pas de savoir" },
    tone: { type: "object", properties: { me: toneJson, other: toneJson }, required: ["me", "other"] },
    key_moments: {
      type: "array",
      description: "2 à 5 messages qui ont fait basculer l'échange",
      items: {
        type: "object",
        properties: {
          author: { type: "string", enum: ["me", "other"] },
          quote: { type: "string", description: "Citation exacte, courte" },
          kind: { type: "string", enum: ["escalation", "calming", "misunderstanding", "turning_point"] },
          explanation: { type: "string" },
        },
        required: ["author", "quote", "kind", "explanation"],
      },
    },
    rewrites: {
      type: "array",
      description: "0 à 4 messages de l'utilisateur à reformuler",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          issue: { type: "string", description: "Ce qui pose problème dans la formulation" },
          better: { type: "string", description: "Version reformulée, même fond, ton naturel" },
        },
        required: ["original", "issue", "better"],
      },
    },
    replies: {
      type: "array",
      description:
        "2 ou 3 réponses que l'utilisateur peut envoyer maintenant pour la suite de l'échange, chacune avec une intention différente. Vide si alert.level = serious.",
      items: {
        type: "object",
        properties: {
          intent: {
            type: "string",
            description: "L'intention en 2 à 4 mots (ex. : « Apaiser », « Poser une limite », « Clarifier », « Proposer un appel »)",
          },
          text: { type: "string", description: "Le message à envoyer, écrit dans le style de l'utilisateur" },
        },
        required: ["intent", "text"],
      },
    },
    strengths: { type: "array", items: { type: "string" }, description: "Ce que l'utilisateur a bien fait (0 à 3)" },
    advice: { type: "array", items: { type: "string" }, description: "2 à 4 conseils concrets pour la suite" },
    draft: {
      type: ["object", "null"],
      description: "Uniquement si un brouillon de réponse est fourni, sinon null",
      properties: {
        reception: { type: "string", description: "Comment ce brouillon sera probablement reçu" },
        risks: { type: "array", items: { type: "string" } },
        improved: { type: "string", description: "Version améliorée, prête à envoyer" },
      },
      required: ["reception", "risks", "improved"],
    },
  },
  required: [
    "readable",
    "transcript",
    "title",
    "verdict_line",
    "summary",
    "me_name",
    "other_name",
    "alert",
    "responsibility",
    "confidence",
    "missing_context",
    "tone",
    "key_moments",
    "rewrites",
    "strengths",
    "advice",
    "replies",
    "draft",
  ],
} as const;

/* ---------- Coach (questions après le verdict) ---------- */

export const coachRequestSchema = z.object({
  verdict: resultSchema,
  relation: z.enum(RELATIONS).optional(),
  context: z.string().max(1500).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "coach"]), text: z.string().max(4000) }))
    .max(40),
  question: z.string().trim().min(2).max(1500),
});
export type CoachRequest = z.infer<typeof coachRequestSchema>;

export type CoachTurn = { role: "user" | "coach"; text: string; message?: string | null };

export const coachJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string", description: "Ta réponse à la question, en français clair, 1 à 6 phrases" },
    message: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "Un message prêt à envoyer à l'autre personne, seulement si la question en appelle un (sinon null), écrit dans le style de l'utilisateur",
    },
  },
  required: ["answer", "message"],
} as const;
