# CloudWeb

**Tu sitio web, creado en conversación.**

CloudWeb es una plataforma SaaS donde cualquier persona crea su web profesional hablando con un agente de IA llamado Lúa. El usuario describe lo que quiere, el agente traduce eso en componentes visuales, y el resultado se publica con un clic en `{nombre}.cloudweb.app`.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS + tokens custom (monocromático editorial) |
| Auth | Supabase Auth (magic link) |
| DB | Supabase Postgres + RLS |
| Agente IA | Anthropic Claude Sonnet 4.6 (via SDK) |
| Pagos intl | Stripe (USD) |
| Pagos AR | MercadoPago (ARS) |
| Email | Resend + React Email |
| Rate limit | Upstash Redis |
| Deploy | Vercel |
| Analytics | Posthog + Sentry |

## Setup rápido (local)

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local

# 3. Levantar Supabase local
npx supabase start

# 4. Copiar las credenciales que imprime supabase start a .env.local:
#    NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#    SUPABASE_SERVICE_ROLE_KEY=...

# 5. Aplicar migraciones
npx supabase db reset

# 6. Generar tipos TypeScript
npm run db:types

# 7. Arrancar el dev server
npm run dev
```

URLs locales:
- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **Inbucket (emails)**: http://localhost:54324 ← ver magic links aquí

## Setup producción

### 1. Supabase (base de datos)

1. Crear proyecto en [supabase.com](https://supabase.com) → región Frankfurt (EU)
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push` (aplica las 10 migraciones)
4. Dashboard → Auth → Providers → Email:
   - Activar "Enable email magic link"
   - Desactivar "Enable email signups with password"
   - URL Configuration → Site URL: `https://cloudweb.app`
   - Redirect URLs: `https://cloudweb.app/auth/callback`

### 2. Stripe (pagos internacionales)

1. Crear cuenta en [stripe.com](https://stripe.com)
2. Crear producto "CloudWeb Pro" → precio $29/mes
3. Copiar Price ID a `NEXT_PUBLIC_STRIPE_PRICE_ID`
4. Webhook → endpoint: `https://cloudweb.app/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
5. Customer Portal → activar (Stripe lo configura automático)

### 3. MercadoPago (pagos Argentina)

1. Crear aplicación en [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Copiar Access Token (producción) a `MERCADOPAGO_ACCESS_TOKEN`
3. Webhook → URL: `https://cloudweb.app/api/mercadopago/webhook`
   - Eventos: subscription_preapproval

### 4. Servicios auxiliares

| Servicio | Qué hacer | Variable |
|---|---|---|
| [Resend](https://resend.com) | Crear cuenta + verificar dominio + SPF/DKIM | `RESEND_API_KEY` |
| [Upstash](https://upstash.com) | Crear Redis database | `UPSTASH_REDIS_REST_URL`, `..._TOKEN` |
| [Sentry](https://sentry.io) | Crear proyecto Next.js | `NEXT_PUBLIC_SENTRY_DSN` |
| [Posthog](https://posthog.com) | Crear proyecto (EU cloud) | `NEXT_PUBLIC_POSTHOG_KEY` |
| [Anthropic](https://console.anthropic.com) | API key | `ANTHROPIC_API_KEY` |

### 5. Vercel (deploy)

1. Importar repo en [vercel.com/new](https://vercel.com/new)
2. Configurar TODAS las env vars del `.env.example`
3. Dominio: `cloudweb.app` + wildcard `*.cloudweb.app`
4. Región: `fra1` (Frankfurt, EU)

### 6. DNS (subdominios)

Para que `cafe-lua.cloudweb.app` funcione, necesitas un **wildcard CNAME**:

```
*.cloudweb.app → cname.vercel-dns.com
```

Vercel resuelve el certificado SSL wildcard automáticamente.

## Estructura del proyecto

```
src/
├── app/
│   ├── (marketing)/    → landing, pricing, legales
│   ├── (auth)/         → login (magic link), check-email
│   ├── (app)/          → dashboard, builder, settings
│   ├── (public)/       → render de sitios publicados
│   └── api/            → agent/chat, stripe, mercadopago, publish
├── blocks/             → 12 componentes renderizables (6 tipos × 2 variantes)
├── components/         → UI compartida (chat, preview, iconos)
├── lib/
│   ├── agent/          → runner, tools, guardrails, quota, persistencia
│   ├── builder/        → catálogo, operaciones, schemas Zod, render
│   ├── mercadopago/    → cliente REST
│   ├── stripe/         → cliente, planes
│   ├── supabase/       → server, client, admin, middleware
│   ├── email/          → resend + templates React Email
│   └── publishing/     → snapshot de publicación
├── templates/          → 4 JSONs (portfolio, services, restaurant, blank)
└── types/              → builder.ts, db.ts
```

## Modelo de datos del builder

Cada sitio es un JSON con lista de secciones tipadas (modelo D):

```json
{
  "version": 1,
  "theme": { "accent": "warm-bone", ... },
  "pages": [{
    "slug": "/",
    "sections": [
      { "id": "sec_01", "type": "hero", "variant": "centered", "props": { ... } },
      { "id": "sec_02", "type": "features", "variant": "three-col-icons", "props": { ... } }
    ]
  }]
}
```

6 tipos × 2 variantes = 12 componentes: hero, features, testimonials, contact, faq, footer.

## Agente IA (Lúa)

- Modelo: Claude Sonnet 4.6 (configurable vía env)
- 8 tools: get_site_state, apply_template, add/update/remove_section, reorder_sections, update_site_metadata, publish_site
- Prompt caching activo (system prompt se cachea → -90% coste)
- Guardrails: input (longitud, injection patterns), output (publish requiere confirmación, max 3 removes/turn)
- Quota: 200 turns/mes con soft-block + email al founder
- Streaming: solo texto final, no tool_uses intermedios

## Pagos

| País | Provider | Moneda | Precio |
|---|---|---|---|
| Argentina | MercadoPago | ARS | $14.999/mes |
| Resto | Stripe | USD | US$29/mes |

Detección automática por `x-vercel-ip-country`. El usuario puede cambiar manualmente.

## Scripts

```bash
npm run dev          # dev server
npm run build        # build producción
npm run typecheck    # verificar tipos
npm run db:types     # regenerar tipos de Supabase
npm run db:reset     # reset + re-aplicar migraciones
npm run stripe:listen # forward webhooks Stripe a localhost
```

## Licencia

Propietario. Todos los derechos reservados.
