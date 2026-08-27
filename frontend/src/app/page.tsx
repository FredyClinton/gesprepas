// Page d'accueil minimale : elle sert uniquement à valider visuellement que les
// tokens de couleur de la charte graphique et la police Montserrat sont bien
// appliqués. Les écrans métier (connexion, tableaux de bord...) viendront
// remplacer ce contenu module par module.
export default function Home() {
  return (
    <main className="bg-brand-white flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-brand-anthracite text-5xl font-bold tracking-tight">
        EXCELIS <span className="text-brand-orange">PRÉPAS</span>
      </h1>
      <p className="text-brand-gray mt-4 text-base font-normal">
        Plateforme de gestion multi-centres
      </p>
    </main>
  );
}
