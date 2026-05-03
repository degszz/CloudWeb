/**
 * Layout del preview del builder.
 *
 * Importante: este layout ROMPE la herencia del layout (app) porque
 * queremos renderizar el sitio del usuario CRUDO, sin nuestro header.
 * Para el iframe del builder es paridad total con el render público.
 */
export default function BuilderPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-canvas">{children}</div>;
}
