import type Anthropic from '@anthropic-ai/sdk';

import { SECTION_TYPES, VARIANTS_BY_TYPE } from '@/lib/builder/catalog';

/**
 * Tools del agente CloudWeb.
 *
 * Sigue ai_agent_core.md §4: descripciones ricas, enums donde sea posible,
 * input_schemas estrictos. Cada tool tiene un executor en tool-executors.ts.
 *
 * IMPORTANTE: cualquier cambio en la lista o los inputs requiere actualizar
 * (1) tool-executors.ts, (2) la sección "Capacidades" del system prompt,
 * (3) el dataset de eval cuando exista.
 */

const allVariants = Object.values(VARIANTS_BY_TYPE).flat();

export const agentTools: Anthropic.Tool[] = [
  {
    name: 'get_site_state',
    description:
      "Devuelve el estado completo del sitio actual del usuario (theme, páginas, secciones). Úsala SIEMPRE al inicio de una conversación o cuando el usuario haga referencia a 'lo que tengo' o pida cambios sobre algo existente. No la uses si acabas de modificar el sitio en este mismo turno.",
    input_schema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'apply_template',
    description:
      "Aplica un template predefinido como punto de partida. Reemplaza completamente el contenido actual. Úsala solo si el sitio está vacío o el usuario pide explícitamente 'empezar de cero'.",
    input_schema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          enum: ['portfolio-minimal', 'services-warm', 'restaurant-cafe', 'blank'],
          description:
            'portfolio-minimal: para creadores y freelancers. services-warm: servicios profesionales. restaurant-cafe: hostelería y locales físicos. blank: hero + contact únicamente, para usuarios cuyo nicho no encaja con los otros.',
        },
        seedContext: {
          type: 'string',
          description:
            'Una frase del usuario describiendo su negocio. Se usa para pre-rellenar textos realistas en lugar de placeholders.',
        },
      },
      required: ['templateId'],
    },
  },

  {
    name: 'add_section',
    description:
      'Añade una sección nueva al final de la página, o en la posición indicada. Usa una variante apropiada según el tono del sitio.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: SECTION_TYPES as unknown as string[],
        },
        variant: {
          type: 'string',
          enum: allVariants as unknown as string[],
          description:
            'Variante visual del catálogo. Si no estás seguro, omite y se elige la default.',
        },
        props: {
          type: 'object',
          description:
            'Propiedades de la sección según su tipo. Ver schema de cada tipo.',
        },
        position: {
          type: 'integer',
          minimum: 0,
          description: 'Índice donde insertar (0 = primera). Por defecto al final.',
        },
      },
      required: ['type', 'props'],
    },
  },

  {
    name: 'update_section',
    description:
      "Modifica las propiedades de una sección existente. Solo cambia los campos que envíes; el resto se preserva. Si el usuario pide 'cambia el título del hero', usa esto, no remove+add.",
    input_schema: {
      type: 'object',
      properties: {
        sectionId: {
          type: 'string',
          description: 'ID de la sección. Obtenlo de get_site_state.',
        },
        propsPatch: {
          type: 'object',
          description: 'Solo los campos a cambiar.',
        },
        variant: {
          type: 'string',
          enum: allVariants as unknown as string[],
          description: 'Solo si el usuario pide cambio de layout.',
        },
      },
      required: ['sectionId'],
    },
  },

  {
    name: 'remove_section',
    description:
      'Elimina una sección. Pide confirmación al usuario antes de usarla si la sección tiene contenido relevante (texto largo, imágenes).',
    input_schema: {
      type: 'object',
      properties: {
        sectionId: { type: 'string' },
      },
      required: ['sectionId'],
    },
  },

  {
    name: 'reorder_sections',
    description:
      'Reordena las secciones de la página según el array de IDs proporcionado. Debe contener todos los IDs existentes, ninguno extra.',
    input_schema: {
      type: 'object',
      properties: {
        orderedIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['orderedIds'],
    },
  },

  {
    name: 'update_site_metadata',
    description:
      'Actualiza título del navegador, descripción meta o subdominio del sitio. El subdominio debe ser kebab-case, único, y entre 3-30 caracteres.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', maxLength: 60 },
        description: { type: 'string', maxLength: 160 },
        slug: {
          type: 'string',
          pattern: '^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$',
        },
      },
    },
  },

  {
    name: 'publish_site',
    description:
      "Publica la versión actual del sitio en {slug}.nuweb.app. Requiere confirmación explícita del usuario en el turno actual ('publica', 'sí, publícalo'). NO la llames de forma proactiva.",
    input_schema: {
      type: 'object',
      properties: {
        userConfirmedInThisTurn: {
          type: 'boolean',
          description:
            'true si el usuario acaba de pedir explícitamente publicar.',
        },
      },
      required: ['userConfirmedInThisTurn'],
    },
  },
];
