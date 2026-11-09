import Anthropic from "@anthropic-ai/sdk";
import { buildUserContent, SYSTEM_PROMPT } from "@/lib/prompt";
import { SAMPLE_VERDICT } from "@/lib/sample";
import { ConfigError, identify, quota, refund, serverClient } from "@/lib/server";
import { requestSchema, resultSchema, verdictJsonSchema, type AnalyzeResponse, type Verdict } from "@/lib/types";

export const maxDuration = 60;

const fail = (status: number, error: string, extra?: object) => Response.json({ error, ...extra }, { status });

async function runModel(body: ReturnType<typeof requestSchema.parse>): Promise<Verdict> {
  if (process.env.VERDIKT_MOCK === "1") return SAMPLE_VERDICT;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 55_000 });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "rendre_verdict",
        description: "Rend l'analyse structurée de la conversation.",
        input_schema: verdictJsonSchema as unknown as Anthropic.Messages.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "rendre_verdict" },
    messages: [{ role: "user", content: buildUserContent(body) }],
  });
  const block = message.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Réponse du modèle sans verdict");
  return normalize(resultSchema.parse(block.input));
}

function normalize(v: Verdict): Verdict {
  if (v.alert.level === "serious") return { ...v, responsibility: null };
  if (v.responsibility) {
    const total = v.responsibility.me + v.responsibility.other;
    const me = total > 0 ? Math.round((v.responsibility.me / total) * 100) : 50;
    return { ...v, responsibility: { ...v.responsibility, me, other: 100 - me } };
  }
  return v;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail(400, "Requête illisible.");
  }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return fail(400, "Conversation incomplète ou trop longue. Vérifie ce que tu as envoyé.");
  const body = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY && process.env.VERDIKT_MOCK !== "1") {
    return fail(503, "L'analyse n'est pas encore activée : la clé de l'IA n'est pas configurée sur le serveur.");
  }

  let id;
  let q;
  try {
    id = await identify(req);
    q = await quota(id, true);
  } catch (e) {
    if (e instanceof ConfigError) return fail(503, "Le serveur n'est pas entièrement configuré.");
    console.error(e);
    return fail(503, "Service momentanément indisponible. Réessaie dans un instant.");
  }
  if (!q.allowed) {
    return fail(
      429,
      id.userId
        ? `Tu as utilisé tes ${q.limit} analyses du jour. Elles reviennent demain.`
        : `Tu as utilisé tes ${q.limit} analyses gratuites du jour. Crée un compte pour en avoir davantage.`,
      { remaining: 0, limit: q.limit },
    );
  }

  let result: Verdict;
  try {
    result = await runModel(body);
  } catch (e) {
    console.error(e);
    await refund(id);
    return fail(502, "L'analyse a échoué. Ton analyse du jour n'a pas été décomptée, réessaie.");
  }

  if (!result.readable) {
    await refund(id);
    return fail(
      422,
      result.unreadable_reason || "Je n'arrive pas à lire une conversation dans ce que tu as envoyé.",
      { remaining: q.remaining + 1, limit: q.limit },
    );
  }

  // Seul le résultat est enregistré, jamais la conversation d'origine, et seulement pour un compte connecté.
  let savedId: string | null = null;
  if (id.userId && id.token) {
    const { data, error } = await serverClient(id.token)
      .from("analyses")
      .insert({ title: result.title.slice(0, 200), input_mode: body.mode, result })
      .select("id")
      .single();
    if (error) console.error(error);
    savedId = data?.id ?? null;
  }

  const payload: AnalyzeResponse = { result, remaining: q.remaining, limit: q.limit, id: savedId };
  return Response.json(payload);
}
