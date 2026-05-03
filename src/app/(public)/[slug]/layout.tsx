/**
 * Layout del sitio público del usuario.
 *
 * Aislado: no hereda el header / nav de la marketing layout. El sitio
 * publicado se sirve "raw" — el visitante no debe ver nada de CloudWeb
 * salvo el footer mínimo que el propio template incluye.
 */
export default function PublicSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-canvas">{children}</div>;
}
