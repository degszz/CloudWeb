/**
 * Cálculo de coste de cada llamada al modelo.
 *
 * Pricing por 1M tokens (USD). Verificar contra
 * https://docs.claude.com/en/docs/about-claude/pricing antes de producción.
 *
 * Para Sonnet (4.5 / 4.6):
 *   - Input estándar:           $3.00
 *   - Output:                   $15.00
 *   - Prompt cache write (5m):  $3.75   (1.25× input)
 *   - Prompt cache read:        $0.30   (0.10× input)
 *
 * Para Opus 4.x:
 *   - Input estándar:           $15.00
 *   - Output:                   $75.00
 *   - Prompt cache write:       $18.75
 *   - Prompt cache read:        $1.50
 *
 * El runner activa prompt caching del system prompt → el grueso del input
 * de cada turn (~1500 tokens del system) se factura como cache_read = 90%
 * de descuento. Sin esto, el coste de un MVP con 50 usuarios × 200 turns
 * sería 5-10× mayor.
 */

interface ModelPricing {
  /** USD por 1M tokens de input (sin cache). */
  input: number;
  /** USD por 1M tokens de output. */
  output: number;
  /** USD por 1M tokens escritos en cache. */
  cacheWrite: number;
  /** USD por 1M tokens leídos de cache. */
  cacheRead: number;
}

const PRICING: Record<string, ModelPricing> = {
  'claude-sonnet-4-6': {
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
  },
  'claude-sonnet-4-5': {
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
  },
  'claude-opus-4-7': {
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
  },
  'claude-opus-4-6': {
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
  },
  // Fallback conservador si el modelo no está mapeado: usa pricing Opus
  // (peor escenario de coste) para no infraestimar.
  default: {
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
  },
};

interface UsageInput {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
}

export function calculateCostUsd(model: string, usage: UsageInput): number {
  const pricing = PRICING[model] ?? PRICING.default!;

  const standardInputTokens =
    usage.inputTokens -
    (usage.cacheCreationTokens ?? 0) -
    (usage.cacheReadTokens ?? 0);

  const cost =
    (standardInputTokens * pricing.input) / 1_000_000 +
    (usage.outputTokens * pricing.output) / 1_000_000 +
    ((usage.cacheCreationTokens ?? 0) * pricing.cacheWrite) / 1_000_000 +
    ((usage.cacheReadTokens ?? 0) * pricing.cacheRead) / 1_000_000;

  // Trunca a 6 decimales (1 millonésima de dólar) para almacenar en numeric(10,6)
  return Math.round(cost * 1_000_000) / 1_000_000;
}
