import { identify, quota } from "@/lib/server";

export async function GET(req: Request) {
  try {
    const id = await identify(req);
    const q = await quota(id, false);
    return Response.json({ remaining: q.remaining, limit: q.limit });
  } catch {
    return Response.json({ remaining: null, limit: null });
  }
}
