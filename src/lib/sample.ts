import type { Verdict } from "./types";

export const SAMPLE_MESSAGES: { author: "me" | "other"; text: string }[] = [
  { author: "other", text: "T'es où ? Ça fait 40 min que je t'attends au resto" },
  { author: "me", text: "Merde c'était ce soir ?? Je croyais que c'était demain" },
  { author: "other", text: "Sérieux… je te l'ai redit hier" },
  { author: "me", text: "Oui bon ça va, t'es jamais à l'heure non plus toi" },
  { author: "other", text: "Laisse tomber. Je rentre." },
];

export const SAMPLE_VERDICT: Verdict = {
  readable: true,
  title: "Le dîner oublié",
  summary:
    "Tu as oublié un dîner prévu et Camille t'a attendu 40 minutes. Au lieu de t'excuser, tu as contre-attaqué sur ses propres retards, et l'échange s'est fermé.",
  me_name: "Toi",
  other_name: "Camille",
  alert: { level: "none", message: "" },
  responsibility: {
    me: 70,
    other: 30,
    explanation:
      "Sur le fond, l'oubli vient de toi et il avait été rappelé la veille. Sur la forme, ta réponse « t'es jamais à l'heure non plus » déplace le sujet au lieu de reconnaître l'oubli. Camille coupe court sans dire ce qu'elle attend, ce qui n'aide pas non plus.",
  },
  confidence: "medium",
  missing_context: "On ne sait pas si ces oublis sont fréquents, ni ce qui s'est dit de vive voix avant.",
  tone: {
    me: {
      aggressiveness: 6,
      defensiveness: 8,
      listening: 2,
      clarity: 5,
      comment: "Tu passes de la surprise à l'attaque sans jamais t'excuser.",
    },
    other: {
      aggressiveness: 3,
      defensiveness: 3,
      listening: 4,
      clarity: 6,
      comment: "Agacée mais factuelle, puis elle ferme la discussion.",
    },
  },
  key_moments: [
    {
      author: "me",
      quote: "Oui bon ça va, t'es jamais à l'heure non plus toi",
      kind: "escalation",
      explanation: "C'est ici que ça bascule : un reproche répond à un reproche, et l'oubli n'est plus traité.",
    },
    {
      author: "other",
      quote: "Laisse tomber. Je rentre.",
      kind: "turning_point",
      explanation: "Camille se retire. Elle ne demande rien, donc tu n'as aucune prise pour réparer.",
    },
  ],
  rewrites: [
    {
      original: "Oui bon ça va, t'es jamais à l'heure non plus toi",
      issue: "Minimise (« ça va ») puis attaque avec une généralisation (« jamais »).",
      better: "T'as raison, j'ai zappé et c'est nul de t'avoir fait attendre. J'arrive dans 15 min si tu veux bien m'attendre ?",
    },
  ],
  strengths: ["Tu as reconnu tout de suite que tu t'étais trompé de jour."],
  advice: [
    "Commence par l'excuse, sans « mais ».",
    "Si ses retards te pèsent, parles-en à un autre moment, pas en réponse à un reproche.",
    "Propose une réparation concrète : la rejoindre, ou réserver une autre date.",
  ],
  draft: null,
  verdict_line:
    "Sur ce coup, c'est plutôt toi qui as tort : tu as oublié le dîner, et au lieu de t'excuser tu as contre-attaqué sur ses retards.",
  replies: [
    { intent: "Réparer", text: "T'as raison j'ai complètement zappé, dsl. Je peux passer te chercher là ?" },
    { intent: "Reproposer", text: "Je m'en veux. On se refait le resto samedi, c'est moi qui invite" },
  ],
  transcript: SAMPLE_MESSAGES,
};
