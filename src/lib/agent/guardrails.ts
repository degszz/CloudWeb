/**
 * Guardrails del agente.
 *
 * Filosofía (ai_agent_core.md §7): los guardrails son CAPAS, no reglas
 * en el prompt. Input check → LLM → Output check.
 *
 * Capas que aplicamos:
 *   1. INPUT: longitud, prompt injection (flag), idioma
 *   2. OUTPUT (tool calls):
 *      - publish_site sin confirmación → bloqueo
 *      - reorder/remove masivo en un turn → bloqueo (sanidad)
 *      - add_section repetido del mismo type N veces → flag
 *
 * No bloqueamos contenido del usuario (no es un caso de uso típico de
 * toxicidad). Sí bloqueamos acciones destructivas no confirmadas.
 */

const MAX_INPUT_LENGTH = 4000;

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|prior|all|above)\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /disregard.*(rules|instructions|system)/i,
  /\bsystem:\s*$/im,
  /<\/?system>/i,
  /<\|im_start\|>/i,
];

export interface InputGuardrailResult {
  allow: boolean;
  reason?: string;
  /** Si true, loguea pero no bloquea. */
  flagged?: boolean;
}

export function checkUserInput(message: string): InputGuardrailResult {
  if (typeof message !== 'string') {
    return { allow: false, reason: 'Mensaje no es texto.' };
  }
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { allow: false, reason: 'El mensaje está vacío.' };
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      allow: false,
      reason: `Mensaje demasiado largo (${trimmed.length} > ${MAX_INPUT_LENGTH}). Resume e inténtalo de nuevo.`,
    };
  }

  const flagged = INJECTION_PATTERNS.some((re) => re.test(trimmed));
  return { allow: true, flagged };
}

export interface OutputGuardrailResult {
  allow: boolean;
  reason?: string;
}

/** Estado acumulado durante un turn para detectar patrones sospechosos. */
export interface TurnGuardState {
  toolCallCounts: Record<string, number>;
  sectionRemovalsThisTurn: number;
  sectionAddsThisTurn: number;
}

export function newTurnGuardState(): TurnGuardState {
  return {
    toolCallCounts: {},
    sectionRemovalsThisTurn: 0,
    sectionAddsThisTurn: 0,
  };
}

const MAX_REMOVALS_PER_TURN = 3;
const MAX_ADDS_PER_TURN = 8;

/**
 * Valida cada tool call antes de ejecutarlo. Devuelve allow=false con
 * un mensaje legible que el agente verá en tool_result y podrá leer
 * para corregir.
 */
export function checkToolCall(
  toolName: string,
  input: unknown,
  state: TurnGuardState
): OutputGuardrailResult {
  // Actualiza contadores
  state.toolCallCounts[toolName] = (state.toolCallCounts[toolName] ?? 0) + 1;

  // ----- publish_site requiere confirmación explícita en este turn -----
  if (toolName === 'publish_site') {
    const inputObj = (input as { userConfirmedInThisTurn?: unknown }) ?? {};
    if (inputObj.userConfirmedInThisTurn !== true) {
      return {
        allow: false,
        reason:
          'publish_site requiere que el usuario haya confirmado explícitamente en este turn. Pide confirmación primero.',
      };
    }
  }

  // ----- Borrado masivo en un solo turn -----
  if (toolName === 'remove_section') {
    state.sectionRemovalsThisTurn += 1;
    if (state.sectionRemovalsThisTurn > MAX_REMOVALS_PER_TURN) {
      return {
        allow: false,
        reason: `Has intentado eliminar más de ${MAX_REMOVALS_PER_TURN} secciones en un solo turn. Si el usuario quiere "empezar de cero" usa apply_template con templateId="blank" en su lugar.`,
      };
    }
  }

  // ----- Adición masiva (signo de loop o reaplicación de template manual) -----
  if (toolName === 'add_section') {
    state.sectionAddsThisTurn += 1;
    if (state.sectionAddsThisTurn > MAX_ADDS_PER_TURN) {
      return {
        allow: false,
        reason: `Has añadido demasiadas secciones (>${MAX_ADDS_PER_TURN}) en un solo turn. Considera usar apply_template si quieres reemplazar la estructura entera.`,
      };
    }
  }

  // ----- Llamadas redundantes a get_site_state en el mismo turn -----
  if (toolName === 'get_site_state' && (state.toolCallCounts.get_site_state ?? 0) > 2) {
    return {
      allow: false,
      reason:
        'Ya has llamado a get_site_state en este turn. Usa el estado que ya tienes en lugar de re-leerlo.',
    };
  }

  return { allow: true };
}
