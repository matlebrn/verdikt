import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confidentialité" };

export default function Page() {
  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Ce que Verdikt fait de tes conversations</h1>

      <section>
        <h2 className="text-2xl font-bold">La conversation que tu envoies</h2>
        <p className="mt-2">
          Captures, export ou messages saisis sont transmis à l'IA (Claude, d'Anthropic) le temps de l'analyse. Verdikt
          ne les enregistre pas sur ses serveurs : ni les images, ni le texte, ni ton brouillon de réponse. Ce que tu saisis
          est gardé uniquement sur ton appareil, pour ne rien perdre si la page se recharge, jusqu'à ce que tu cliques
          sur « Tout effacer » ou que tu lances une autre analyse.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Le résultat de l'analyse</h2>
        <p className="mt-2">
          Sans compte, rien n'est gardé sur les serveurs : le dernier résultat reste seulement sur ton appareil. Avec un compte, le résultat
          est enregistré dans ton historique. Il contient de courtes citations des messages. Tu peux supprimer une
          analyse, ou ton compte entier, à tout moment.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">La limite quotidienne</h2>
        <p className="mt-2">
          Pour compter tes analyses du jour sans compte, Verdikt garde une empreinte chiffrée de ton adresse IP,
          impossible à retransformer en adresse. L'adresse elle-même n'est pas stockée.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Les autres personnes dans la conversation</h2>
        <p className="mt-2">
          La personne en face n'a pas choisi d'être analysée. Garde le résultat pour toi : il sert à prendre du recul,
          pas à prouver quoi que ce soit à quelqu'un.
        </p>
      </section>
    </div>
  );
}
