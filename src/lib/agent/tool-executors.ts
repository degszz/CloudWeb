import 'server-only';

import {
  readSiteContent,
  updateSiteMetadata,
  writeSiteContent,
} from '@/lib/agent/persistence';
import type { ToolExecutionResult } from '@/lib/agent/types';
import {
  addSection,
  removeSection,
  reorderSections,
  updateSection,
} from '@/lib/builder/operations';
import { siteContentSchema } from '@/lib/builder/schema';
import { publishSiteSnapshot } from '@/lib/publishing/snapshot';
import { getTemplate, isValidTemplateId } from '@/templates';
import { getPublishedUrl } from '@/lib/utils';

/**
 * Implementación de las 8 tools del agente.
 *
 * Patrón común:
 *   - Validar input mínimamente (el schema de la tool ya filtró formas)
 *   - Cargar estado actual del site (read)
 *   - Aplicar operación pura sobre el JSON (en lib/builder/operations.ts)
 *   - Si la operación es exitosa, persistir (write)
 *   - Devolver un ToolExecutionResult que el modelo lee
 *
 * Errores: nunca lanzamos. Devolvemos { success: false, error } para que
 * el modelo lo vea en el tool_result y reintente con corrección.
 *
 * Idempotencia: las tools de escritura incrementan content_version. Si
 * dos tools se llaman en paralelo en el mismo turn (Claude lo soporta),
 * el orden de las writes es el orden de await en el runner (secuencial).
 */

interface ExecutionContext {
  siteId: string;
  userId: string;
}

type ToolHandler = (
  ctx: ExecutionContext,
  input: Record<string, unknown>
) => Promise<ToolExecutionResult>;

// =========================================================================
// get_site_state
// =========================================================================
const getSiteState: ToolHandler = async (ctx) => {
  try {
    const site = await readSiteContent(ctx.siteId, ctx.userId);
    return {
      success: true,
      result: {
        siteId: site.id,
        slug: site.slug,
        name: site.name,
        description: site.description,
        version: site.content_version,
        isPublished: site.is_published,
        content: site.content_json,
      },
    };
  } catch (err) {
    return {
      success: false,
      result: null,
      error: `No se pudo leer el sitio: ${(err as Error).message}`,
    };
  }
};

// =========================================================================
// apply_template
// =========================================================================
const applyTemplate: ToolHandler = async (ctx, input) => {
  const templateId = input.templateId;
  if (typeof templateId !== 'string' || !isValidTemplateId(templateId)) {
    return {
      success: false,
      result: null,
      error: `templateId inválido. Usa uno de: portfolio-minimal, services-warm, restaurant-cafe, blank.`,
    };
  }

  try {
    const site = await readSiteContent(ctx.siteId, ctx.userId);
    const template = getTemplate(templateId);

    await writeSiteContent(
      ctx.siteId,
      ctx.userId,
      template,
      site.content_version + 1
    );

    return {
      success: true,
      mutatedState: true,
      result: {
        applied: templateId,
        sectionCount: template.pages[0]?.sections.length ?? 0,
        message: `Template "${templateId}" aplicado. El sitio ahora tiene ${template.pages[0]?.sections.length ?? 0} secciones listas para personalizar.`,
      },
    };
  } catch (err) {
    return {
      success: false,
      result: null,
      error: (err as Error).message,
    };
  }
};

// =========================================================================
// add_section
// =========================================================================
const addSectionHandler: ToolHandler = async (ctx, input) => {
  try {
    const site = await readSiteContent(ctx.siteId, ctx.userId);
    const parsed = siteContentSchema.safeParse(site.content_json);
    if (!parsed.success) {
      return {
        success: false,
        result: null,
        error: 'El contenido actual del sitio no es válido. Llama a get_site_state para inspeccionarlo.',
      };
    }

    const op = addSection(parsed.data, {
      type: input.type as string,
      variant: input.variant as string | undefined,
      props: (input.props as Record<string, unknown>) ?? {},
      position: input.position as number | undefined,
    });

    if (!op.ok) {
      return { success: false, result: null, error: op.error };
    }

    // Re-validar el resultado completo: detecta props inválidos por type
    const finalCheck = siteContentSchema.safeParse(op.content);
    if (!finalCheck.success) {
      return {
        success: false,
        result: null,
        error: `Props de la sección no válidos: ${finalCheck.error.errors[0]?.message ?? 'forma incorrecta'}.`,
      };
    }

    await writeSiteContent(
      ctx.siteId,
      ctx.userId,
      op.content,
      site.content_version + 1
    );

    return {
      success: true,
      mutatedState: true,
      result: {
        sectionId: op.sectionId,
        message: `Sección añadida con id ${op.sectionId}.`,
      },
    };
  } catch (err) {
    return { success: false, result: null, error: (err as Error).message };
  }
};

// =========================================================================
// update_section
// =========================================================================
const updateSectionHandler: ToolHandler = async (ctx, input) => {
  try {
    const site = await readSiteContent(ctx.siteId, ctx.userId);
    const parsed = siteContentSchema.safeParse(site.content_json);
    if (!parsed.success) {
      return {
        success: false,
        result: null,
        error: 'El contenido actual del sitio no es válido. Llama a get_site_state.',
      };
    }

    const op = updateSection(parsed.data, {
      sectionId: input.sectionId as string,
      propsPatch: input.propsPatch as Record<string, unknown> | undefined,
      variant: input.variant as string | undefined,
    });

    if (!op.ok) return { success: false, result: null, error: op.error };

    const finalCheck = siteContentSchema.safeParse(op.content);
    if (!finalCheck.success) {
      return {
        success: false,
        result: null,
        error: `El cambio dejó la sección con props inválidos: ${finalCheck.error.errors[0]?.message ?? 'forma incorrecta'}. Revisa los campos.`,
      };
    }

    await writeSiteContent(
      ctx.siteId,
      ctx.userId,
      op.content,
      site.content_version + 1
    );

    return {
      success: true,
      mutatedState: true,
      result: { sectionId: op.sectionId, message: 'Sección actualizada.' },
    };
  } catch (err) {
    return { success: false, result: null, error: (err as Error).message };
  }
};

// =========================================================================
// remove_section
// =========================================================================
const removeSectionHandler: ToolHandler = async (ctx, input) => {
  try {
    const site = await readSiteContent(ctx.siteId, ctx.userId);
    const parsed = siteContentSchema.safeParse(site.content_json);
    if (!parsed.success) {
      return {
        success: false,
        result: null,
        error: 'El contenido actual del sitio no es válido.',
      };
    }

    const op = removeSection(parsed.data, {
      sectionId: input.sectionId as string,
    });

    if (!op.ok) return { success: false, result: null, error: op.error };

    await writeSiteContent(
      ctx.siteId,
      ctx.userId,
      op.content,
      site.content_version + 1
    );

    return {
      success: true,
      mutatedState: true,
      result: { message: 'Sección eliminada.' },
    };
  } catch (err) {
    return { success: false, result: null, error: (err as Error).message };
  }
};

// =========================================================================
// reorder_sections
// =========================================================================
const reorderSectionsHandler: ToolHandler = async (ctx, input) => {
  try {
    const site = await readSiteContent(ctx.siteId, ctx.userId);
    const parsed = siteContentSchema.safeParse(site.content_json);
    if (!parsed.success) {
      return {
        success: false,
        result: null,
        error: 'El contenido actual del sitio no es válido.',
      };
    }

    const op = reorderSections(parsed.data, {
      orderedIds: input.orderedIds as string[],
    });

    if (!op.ok) return { success: false, result: null, error: op.error };

    await writeSiteContent(
      ctx.siteId,
      ctx.userId,
      op.content,
      site.content_version + 1
    );

    return {
      success: true,
      mutatedState: true,
      result: { message: 'Secciones reordenadas.' },
    };
  } catch (err) {
    return { success: false, result: null, error: (err as Error).message };
  }
};

// =========================================================================
// update_site_metadata
// =========================================================================
const updateSiteMetadataHandler: ToolHandler = async (ctx, input) => {
  const patch: { name?: string; description?: string; slug?: string } = {};
  if (typeof input.title === 'string') patch.name = input.title;
  if (typeof input.description === 'string') patch.description = input.description;
  if (typeof input.slug === 'string') patch.slug = input.slug;

  if (Object.keys(patch).length === 0) {
    return { success: false, result: null, error: 'Debes proporcionar al menos uno: title, description o slug.' };
  }

  const result = await updateSiteMetadata(ctx.siteId, ctx.userId, patch);
  if (!result.ok) return { success: false, result: null, error: result.error };

  return {
    success: true,
    mutatedState: true,
    result: { message: 'Metadatos del sitio actualizados.', applied: patch },
  };
};

// =========================================================================
// publish_site
// =========================================================================
const publishSiteHandler: ToolHandler = async (ctx, input) => {
  // El guardrail checkToolCall ya bloquea la llamada si userConfirmedInThisTurn
  // no es true. Aquí es solo defensa final.
  if (input.userConfirmedInThisTurn !== true) {
    return {
      success: false,
      result: null,
      error: 'Necesitas confirmación explícita del usuario en este turno antes de publicar.',
    };
  }

  const result = await publishSiteSnapshot(ctx.siteId, ctx.userId);
  if (!result.ok) {
    return { success: false, result: null, error: result.error };
  }

  return {
    success: true,
    mutatedState: true,
    result: {
      message: `Sitio publicado correctamente.`,
      url: result.url,
      version: result.version,
    },
  };
};

// =========================================================================
// Registry de handlers
// =========================================================================
const HANDLERS: Record<string, ToolHandler> = {
  get_site_state: getSiteState,
  apply_template: applyTemplate,
  add_section: addSectionHandler,
  update_section: updateSectionHandler,
  remove_section: removeSectionHandler,
  reorder_sections: reorderSectionsHandler,
  update_site_metadata: updateSiteMetadataHandler,
  publish_site: publishSiteHandler,
};

/**
 * Ejecuta una tool por nombre. Único punto de entrada desde el runner.
 */
export async function executeTool(
  ctx: ExecutionContext,
  name: string,
  input: unknown
): Promise<ToolExecutionResult> {
  const handler = HANDLERS[name];
  if (!handler) {
    return {
      success: false,
      result: null,
      error: `Tool "${name}" no existe. Revisa el catálogo y reintenta.`,
    };
  }

  try {
    return await handler(ctx, (input as Record<string, unknown>) ?? {});
  } catch (err) {
    // Error inesperado del handler — log para debug y devolver al modelo
    console.error(`[tool ${name}] error inesperado:`, err);
    return {
      success: false,
      result: null,
      error: `Error inesperado al ejecutar ${name}.`,
    };
  }
}

// Suprimir warning de imports no utilizados con el alias de utils
void getPublishedUrl;
