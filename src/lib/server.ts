import "server-only";
import { createHmac } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PLANS, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, type PlanId } from "./config";

export class ConfigError extends Error {}

export function serverClient(token?: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export type Identity = { subject: string; limit: number; userId: string | null; token: string | null; plan: PlanId };

function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    "inconnue"
  );
}

export async function identify(req: Request): Promise<Identity> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    const { data } = await serverClient().auth.getUser(token);
    if (data.user) {
      const plan = await planOf(data.user.id);
      return { subject: `u:${data.user.id}`, limit: PLANS[plan].analyses, userId: data.user.id, token, plan };
    }
  }
  const salt = process.env.IP_SALT;
  if (!salt) throw new ConfigError("IP_SALT manquant");
  // L'adresse IP n'est jamais stockée : seulement une empreinte non réversible.
  const hash = createHmac("sha256", salt).update(clientIp(req)).digest("hex").slice(0, 40);
  return { subject: `g:${hash}`, limit: PLANS.guest.analyses, userId: null, token: null, plan: "guest" };
}

/** Plan actif d'un compte (abonnement Verdikt+ ou gratuit). En cas de doute : gratuit. */
async function planOf(userId: string): Promise<PlanId> {
  const secret = process.env.QUOTA_SECRET;
  if (!secret) return "free";
  const { data, error } = await serverClient().rpc("user_plan", { p_secret: secret, p_user: userId });
  if (error) {
    console.error(error);
    return "free";
  }
  return data === "plus" ? "plus" : "free";
}

export type Quota = { allowed: boolean; remaining: number; limit: number };

export async function quota(id: Identity, consume: boolean): Promise<Quota> {
  const secret = process.env.QUOTA_SECRET;
  if (!secret) throw new ConfigError("QUOTA_SECRET manquant");
  const { data, error } = await serverClient().rpc("consume_quota", {
    p_secret: secret,
    p_subject: id.subject,
    p_limit: id.limit,
    p_consume: consume,
  });
  if (error) throw new Error(`Quota indisponible : ${error.message}`);
  return data as Quota;
}

export async function refund(id: Identity): Promise<void> {
  const secret = process.env.QUOTA_SECRET;
  if (!secret) return;
  await serverClient().rpc("refund_quota", { p_secret: secret, p_subject: id.subject });
}
