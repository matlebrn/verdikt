# Verdikt

Analyse une conversation (captures d'écran, export texte ou saisie à la main) : part de responsabilité de chacun, ton, messages clés, reformulations, avis sur un brouillon de réponse.

Next.js (App Router) · Supabase (comptes, historique, quota quotidien) · Claude (analyse) · Vercel.

## Variables d'environnement (serveur)

| Nom | Rôle |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clé de l'API Claude. Sans elle, l'analyse répond « pas encore activée ». |
| `ANTHROPIC_MODEL` | Facultatif. Par défaut `claude-sonnet-5-5`. |
| `QUOTA_SECRET` | Secret partagé avec la fonction SQL `consume_quota`. |
| `IP_SALT` | Sel pour l'empreinte des adresses IP des invités. |
| `VERDIKT_MOCK` | `1` en local pour tester sans clé (renvoie l'analyse d'exemple). |

## Développement

```bash
npm install
npm run dev
```

## Données

- `public.analyses` : résultats enregistrés des utilisateurs connectés (RLS : chacun ne voit que les siens). La conversation d'origine n'est jamais stockée.
- `private.daily_usage` : compteur d'analyses par jour, par compte ou par empreinte d'IP.
- Limites dans `src/lib/config.ts` : 3 analyses par jour sans compte, 10 avec.
