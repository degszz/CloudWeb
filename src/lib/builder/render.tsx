import { blockRegistry } from '@/blocks/registry';
import type { SectionType, VariantOf } from '@/lib/builder/catalog';
import { siteContentSchema } from '@/lib/builder/schema';

/**
 * Renderiza el JSON de un sitio (modelo D) a un árbol React.
 *
 * Estrategia defensiva:
 *   - Validamos el JSON completo con Zod antes de renderizar
 *   - Si el JSON está roto, devolvemos null (el caller decide qué mostrar)
 *   - Si una sección individual es inválida, su componente devuelve null
 *     (Zod en cada componente actúa como segunda barrera)
 *
 * Sin estado: dado el mismo JSON, devuelve el mismo árbol — esto permite
 * cachear sitios publicados con full ISR.
 */

interface RenderResult {
  ok: boolean;
  /** Árbol React si el JSON es válido. */
  tree: React.ReactNode;
  /** Mensaje de error si el JSON es inválido. */
  error?: string;
}

export function renderSite(rawContent: unknown): RenderResult {
  const parsed = siteContentSchema.safeParse(rawContent);
  if (!parsed.success) {
    return {
      ok: false,
      tree: null,
      error: parsed.error.message,
    };
  }

  const page = parsed.data.pages[0];
  if (!page) {
    return { ok: true, tree: null };
  }

  const tree = (
    <>
      {page.sections.map((section) => (
        <RenderSection key={section.id} section={section} />
      ))}
    </>
  );

  return { ok: true, tree };
}

function RenderSection({
  section,
}: {
  section: { id: string; type: string; variant: string; props: unknown };
}) {
  const variants = blockRegistry[section.type as SectionType];
  if (!variants) return null;

  const variantKey = section.variant as VariantOf<SectionType>;
  const Component = (
    variants as Record<
      string,
      React.ComponentType<{ id: string; props: Record<string, unknown> }>
    >
  )[variantKey];
  if (!Component) return null;

  return (
    <Component
      id={section.id}
      props={(section.props as Record<string, unknown>) ?? {}}
    />
  );
}
