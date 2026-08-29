export { auth as proxy } from "@/auth";

// Le proxy tourne sur TOUTES les routes sauf celles listées ici. On exclut :
// - /api/auth/* : les endpoints d'Auth.js lui-même (sinon, impossible de se connecter —
//   le proxy bloquerait la requête de connexion avant qu'elle n'aboutisse)
// - /login : notre page de connexion, qui doit justement être accessible sans session
// - les assets statiques Next.js et le favicon
export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
