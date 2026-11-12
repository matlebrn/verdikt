import { PLANS } from "@/lib/config";
import { identify, quota } from "@/lib/server";

export async function GET(req: Request) {
  try {
    const id = await identify(req);
    const coachId = { ...id, subject: `c:${id.subject}`, limit: PLANS[id.plan].questions };
    const [q, c] = await Promise.all([quota(id, false), quota(coachId, false)]);
    return Response.json({ plan: id.plan, remaining: q.remaining, limit: q.limit, questions: c.remaining, questionsLimit: c.limit });
  } catch {
    return Response.json({ plan: "guest", remaining: null, limit: null });
  }
}
