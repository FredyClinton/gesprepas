// Marqueur visuel apposé sur toute donnée de démonstration (mocks.ts) affichée en
// attendant que le backend expose le champ réel — évite de laisser croire à
// l'utilisateur qu'un email/téléphone/etc. fictif est une vraie donnée.
export function BadgeDemo() {
  return (
    <span
      title="Donnée de démonstration — en attente du champ correspondant côté API"
      className="bg-brand-gray/10 text-brand-gray ml-1.5 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wide uppercase"
    >
      Démo
    </span>
  );
}
