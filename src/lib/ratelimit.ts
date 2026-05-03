import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting por usuario.
 *
 * El agente IA es un endpoint que puede gastar mucho dinero rápido —
 * un usuario sin límite podría costarnos $200 en una tarde. Esto es
 * MUST según el plan aprobado.
 *
 * Si las env vars de Upstash no están configuradas, los limiters
 * actúan como no-op (devuelven success: true). Esto evita que dev
 * local rompa, pero hay que configurarlo SÍ O SÍ antes de producción.
 */

const hasUpstashConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstashConfig ? Redis.fromEnv() : null;

interface LimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function noopLimiter(): LimitResult {
  return { success: true, limit: 9999, remaining: 9999, reset: Date.now() + 60_000 };
}

/** 30 turnos de chat por hora por usuario. Suficiente para uso normal, blinda contra abuso. */
export const agentChatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      analytics: true,
      prefix: 'rl:agent_chat',
    })
  : { limit: async (_id: string): Promise<LimitResult> => noopLimiter() };

/** 5 publicaciones por hora — protege contra deploys en bucle. */
export const publishLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'rl:publish',
    })
  : { limit: async (_id: string): Promise<LimitResult> => noopLimiter() };

/** 10 logins por hora por IP (anti-bruteforce de magic links). */
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'rl:auth',
    })
  : { limit: async (_id: string): Promise<LimitResult> => noopLimiter() };
