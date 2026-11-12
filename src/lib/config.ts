// Valeurs publiques par conception (protégées par les règles RLS côté Supabase).
export const SUPABASE_URL = "https://mtoqggpigsrvtfwzsmbi.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QwN9VPQhxgVL6phzsHN8qQ_Uw7hnuuQ";

export type PlanId = "guest" | "free" | "plus";

export type Plan = {
  name: string;
  analyses: number; // par jour
  questions: number; // questions au coach par jour
  images: number; // captures par analyse
  chars: number; // longueur d'un export texte
  deep: boolean; // analyse approfondie (le modèle réfléchit plus longtemps)
  history: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  guest: { name: "Invité", analyses: 2, questions: 5, images: 6, chars: 30000, deep: false, history: false },
  free: { name: "Gratuit", analyses: 5, questions: 20, images: 6, chars: 30000, deep: false, history: true },
  plus: { name: "Verdikt+", analyses: 40, questions: 200, images: 15, chars: 80000, deep: true, history: true },
};

export const PLUS_PRICE = { month: "4,99 €", year: "34,99 €", yearPerMonth: "2,92 €" };

// Plafonds absolus acceptés par l'API (ceux de Verdikt+).
export const MAX_IMAGES = PLANS.plus.images;
export const MAX_TEXT_CHARS = PLANS.plus.chars;
export const MAX_MANUAL_MESSAGES = 150;
export const COACH_MAX_TURNS = 30;
