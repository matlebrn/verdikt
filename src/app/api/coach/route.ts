import Anthropic from "@anthropic-ai/sdk";
import { PLANS } from "@/lib/config";
import { buildCoachMessages, COACH_PROMPT } from "@/lib/prompt";
import { ConfigError, identify, quota, refund } from "@/lib/server";
import { coachJsonSchema, coachRequestSchema } from "@/lib/types";

export const maxDuration = 60;

const fail = (status: number, error: string, extra?: object) => Response.json({ error, ...extra }, { status });

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail(400, "Requête illisible.");
  }
  const parsed = coachRequestSchema.safeParse(json);
  if (!parsed.success) return fail(400, "Question vide ou trop longue.");
  const body = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) return fail(503, "Le coach n'est pas encore activé sur le serveur.");

  let id;
  let q;
  try {
    const base = await identify(req);
    // Compteur à part : poser des questions ne consomme pas les analyses du jour.
    id = { ...base, subject: `c:${base.subject}`, limit: PLANS[base.plan].questions };
    q = await quota(id, true);
  } catch (e) {
    if (e instanceof ConfigError) return fail(503, "Le serveur n'est pas entièrement configuré.");
    console.error(e);
    return fail(503, "Service momentanément indisponible. Réessaie dans un instant.");
  }
  if (!q.allowed) {
    return fail(
      429,
      id.plan === "plus"
        ? `Tu as posé tes ${q.limit} questions du jour. Elles reviennent demain.`
        : id.plan === "free"
          ? `Tu as posé tes ${q.limit} questions du jour. Avec Verdikt+, tu en as ${PLANS.plus.questions}.`
          : `Tu as posé tes ${q.limit} questions gratuites du jour. Avec un compte, tu en as ${PLANS.free.questions}.`,
      { remaining: 0, limit: q.limit, upgrade: id.plan !== "plus" },
    );
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 55_000 });
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 2500,
      system: COACH_PROMPT,
      output_config: { effort: "low", format: { type: "json_schema", schema: coachJsonSchema as unknown as Record<string, unknown> } },
      messages: buildCoachMessages(body),
    });
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const out = JSON.parse(text) as { answer?: unknown; message?: unknown };
    if (typeof out.answer !== "string" || !out.answer.trim()) throw new Error("Réponse vide");
    return Response.json({
      answer: out.answer.trim(),
      message: typeof out.message === "string" && out.message.trim() ? out.message.trim() : null,
      remaining: q.remaining,
      limit: q.limit,
    });
  } catch (e) {
    console.error(e);
    await refund(id);
    return fail(502, "Le coach n'a pas pu répondre. Ta question n'a pas été décomptée, réessaie.");
  }
}
