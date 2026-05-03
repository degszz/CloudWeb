import { randomUUID } from 'node:crypto';

import {
  DEFAULT_VARIANT,
  isValidType,
  isValidVariant,
  type SectionType,
} from '@/lib/builder/catalog';
import type { Section, SiteContent } from '@/types/builder';

/**
 * Operaciones puras sobre el JSON de un sitio.
 *
 * Reglas:
 *   - No mutan el input. Devuelven un nuevo SiteContent.
 *   - Validan parámetros y devuelven OperationResult con error si algo
 *     no encaja, en lugar de lanzar. El runner del agente convierte el
 *     error en un tool_result que el modelo puede ver y reintentar.
 *   - Trabajan sobre la primera página (MVP: 1 página por sitio).
 */

export type OperationResult =
  | { ok: true; content: SiteContent; sectionId?: string }
  | { ok: false; error: string };

export function addSection(
  content: SiteContent,
  args: {
    type: string;
    variant?: string;
    props: Record<string, unknown>;
    position?: number;
  }
): OperationResult {
  if (!isValidType(args.type)) {
    return { ok: false, error: `Tipo "${args.type}" no existe en el catálogo.` };
  }
  const type: SectionType = args.type;
  const variant = args.variant ?? DEFAULT_VARIANT[type];
  if (!isValidVariant(type, variant)) {
    return {
      ok: false,
      error: `Variante "${variant}" no existe para tipo "${type}".`,
    };
  }

  const newSection: Section = {
    id: `sec_${randomUUID().slice(0, 8)}`,
    type,
    variant,
    props: args.props,
  };

  const page = content.pages[0];
  if (!page) {
    return { ok: false, error: 'El sitio no tiene páginas.' };
  }

  const sections = [...page.sections];
  const insertAt =
    typeof args.position === 'number'
      ? Math.max(0, Math.min(args.position, sections.length))
      : sections.length;
  sections.splice(insertAt, 0, newSection);

  return {
    ok: true,
    sectionId: newSection.id,
    content: replacePageSections(content, sections),
  };
}

export function updateSection(
  content: SiteContent,
  args: {
    sectionId: string;
    propsPatch?: Record<string, unknown>;
    variant?: string;
  }
): OperationResult {
  const page = content.pages[0];
  if (!page) return { ok: false, error: 'El sitio no tiene páginas.' };

  const idx = page.sections.findIndex((s) => s.id === args.sectionId);
  if (idx === -1) {
    return { ok: false, error: `No existe sección con id "${args.sectionId}".` };
  }
  const current = page.sections[idx]!;

  let nextVariant = current.variant;
  if (args.variant !== undefined) {
    if (!isValidVariant(current.type, args.variant)) {
      return {
        ok: false,
        error: `Variante "${args.variant}" no existe para tipo "${current.type}".`,
      };
    }
    nextVariant = args.variant as typeof current.variant;
  }

  const updated: Section = {
    ...current,
    variant: nextVariant,
    props: args.propsPatch
      ? { ...current.props, ...args.propsPatch }
      : current.props,
  };

  const nextSections = [...page.sections];
  nextSections[idx] = updated;
  return {
    ok: true,
    sectionId: current.id,
    content: replacePageSections(content, nextSections),
  };
}

export function removeSection(
  content: SiteContent,
  args: { sectionId: string }
): OperationResult {
  const page = content.pages[0];
  if (!page) return { ok: false, error: 'El sitio no tiene páginas.' };

  const next = page.sections.filter((s) => s.id !== args.sectionId);
  if (next.length === page.sections.length) {
    return { ok: false, error: `No existe sección con id "${args.sectionId}".` };
  }
  return { ok: true, content: replacePageSections(content, next) };
}

export function reorderSections(
  content: SiteContent,
  args: { orderedIds: string[] }
): OperationResult {
  const page = content.pages[0];
  if (!page) return { ok: false, error: 'El sitio no tiene páginas.' };

  const currentIds = new Set(page.sections.map((s) => s.id));
  const requestedIds = new Set(args.orderedIds);

  if (
    currentIds.size !== requestedIds.size ||
    [...currentIds].some((id) => !requestedIds.has(id))
  ) {
    return {
      ok: false,
      error:
        'orderedIds debe contener exactamente los IDs actuales, sin extras ni faltantes.',
    };
  }

  const byId = new Map(page.sections.map((s) => [s.id, s] as const));
  const next = args.orderedIds.map((id) => byId.get(id)!);

  return { ok: true, content: replacePageSections(content, next) };
}

function replacePageSections(content: SiteContent, sections: Section[]): SiteContent {
  return {
    ...content,
    pages: content.pages.map((p, i) =>
      i === 0 ? { ...p, sections } : p
    ),
  };
}
