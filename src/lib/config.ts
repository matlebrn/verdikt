// Valeurs publiques par conception (protégées par les règles RLS côté Supabase).
export const SUPABASE_URL = "https://mtoqggpigsrvtfwzsmbi.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QwN9VPQhxgVL6phzsHN8qQ_Uw7hnuuQ";

export const GUEST_LIMIT = 3;
export const USER_LIMIT = 10;

export const MAX_IMAGES = 6;
export const MAX_TEXT_CHARS = 30000;
export const MAX_MANUAL_MESSAGES = 150;

// Questions au coach après un verdict (compteur séparé des analyses).
export const COACH_GUEST_LIMIT = 15;
export const COACH_USER_LIMIT = 40;
export const COACH_MAX_TURNS = 20;
