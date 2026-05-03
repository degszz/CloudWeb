---
name: saas-starter-kit
description: Genera un SaaS funcional con autenticación, base de datos, pagos con Stripe, emails transaccionales y deploy en producción. Usar cuando el usuario pida "un SaaS", "app con login y pagos", "app con suscripción", "app multi-usuario", "app con Stripe" o similar. Entrega un Next.js 14 + Supabase + Stripe listo para desplegar.
---

# SaaS Starter Kit

Cero a SaaS funcional con pagos recurrentes en una sesión. Stack moderno, boring, probado.

## Stack por defecto

- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Auth + DB**: Supabase (PostgreSQL + RLS)
- **Pagos**: Stripe (subscriptions + Customer Portal)
- **Emails**: Resend + React Email
- **Deploy**: Vercel
- **Analytics**: Posthog (opcional)

Solo cambia el stack si el usuario lo pide explícitamente o tiene un motivo claro.

## Descubrimiento

Antes de generar nada, confirma:

1. **Modelo de pricing**: freemium, trial 14 días, de pago desde día 1.
2. **Planes**: nombres, precios, límites por plan (1 plan = 1 product en Stripe, 1 price por intervalo).
3. **Recursos del dominio**: qué entidades tendrá el usuario (proyectos, documentos, contactos...).
4. **Multi-tenant**: usuario individual o equipos/workspaces.
5. **¿Tiene cuentas Supabase, Stripe, Resend, Vercel creadas?** Si no, guía paso a paso.

## Estructura de archivos

```
src/
  app/
    (marketing)/           # Landing pública
      page.tsx
      pricing/page.tsx
    (auth)/
      login/page.tsx
      signup/page.tsx
      callback/route.ts    # OAuth callback
    (app)/                 # Protegido
      layout.tsx           # Check auth + sidebar
      dashboard/page.tsx
      settings/
        page.tsx
        billing/page.tsx   # Stripe Customer Portal
    api/
      stripe/
        checkout/route.ts
        webhook/route.ts
        portal/route.ts
  components/
    ui/                    # shadcn
    dashboard/
    marketing/
  lib/
    supabase/
      server.ts
      client.ts
      middleware.ts
    stripe/
      client.ts
      plans.ts
    email/
      resend.ts
      templates/
  middleware.ts            # Protege rutas /app
```

## Schema de base de datos

```sql
-- Profiles (extend auth.users)
create table profiles (
  id uuid references auth.users primary key,
  email text unique,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions sync con Stripe
create type subscription_status as enum (
  'trialing', 'active', 'canceled', 'incomplete',
  'incomplete_expired', 'past_due', 'unpaid', 'paused'
);

create table subscriptions (
  id text primary key,                     -- Stripe subscription ID
  user_id uuid references profiles(id) on delete cascade,
  status subscription_status,
  price_id text,
  quantity integer default 1,
  cancel_at_period_end boolean default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now()
);

-- Trigger: crea profile al signup
create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id);

alter table subscriptions enable row level security;
create policy "own subscription" on subscriptions for select using (auth.uid() = user_id);
```

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Lógica Stripe crítica

### Checkout
```typescript
// app/api/stripe/checkout/route.ts
export async function POST(req: Request) {
  const { priceId } = await req.json();
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from("profiles").select("stripe_customer_id").eq("id", user.id).single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;
    await supabase.from("profiles")
      .update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: { trial_period_days: 14 },
    allow_promotion_codes: true,
  });

  return Response.json({ url: session.url });
}
```

### Webhook (fuente de la verdad)
Maneja mínimo estos eventos:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Sincroniza el estado a la tabla `subscriptions`. **Nunca** confíes en el front para saber si un usuario ha pagado: consulta la tabla.

### Gating de features
```typescript
// lib/subscription.ts
export async function canAccess(userId: string, feature: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("price_id, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .single();

  if (!data) return false;
  return PLAN_FEATURES[data.price_id]?.includes(feature) ?? false;
}
```

## Patrones que debes seguir

- **Middleware** refresca sesión Supabase en cada request de `/app/*`
- **Server Components** por defecto; Client Components solo para interactividad
- **Server Actions** para mutaciones, no API routes innecesarias
- **Loading states** con `loading.tsx` y Suspense boundaries
- **Error boundaries** con `error.tsx` en cada segmento
- **Revalidate paths** tras mutaciones que afectan UI

## Anti-patrones

- Gestionar sesión en cliente con localStorage
- Hardcodear planes en frontend (usa Stripe como fuente)
- Dar acceso si `status === 'active'` sin comprobar `current_period_end`
- Usar `service_role_key` en código client-side (NUNCA)
- Olvidar RLS: cualquier tabla sin RLS es un agujero

## Checklist pre-producción

- [ ] RLS activada en todas las tablas con datos de usuario
- [ ] Webhook de Stripe configurado en dashboard con signing secret
- [ ] Pages legales: términos, privacidad, cookies
- [ ] Email transaccional de bienvenida testeado
- [ ] Flujo de "cancelar suscripción" por Customer Portal funciona
- [ ] Handler para `invoice.payment_failed` avisa al usuario
- [ ] Logs de webhooks en Stripe dashboard sin 4xx/5xx
- [ ] Variables de entorno en Vercel production (no solo preview)
- [ ] Dominio con SSL + redirect de www

## Después de entregar

Guía al usuario para:
1. Crear productos y precios en Stripe dashboard (test mode primero)
2. Correr migraciones Supabase desde SQL editor
3. Configurar webhook endpoint en Stripe apuntando a `/api/stripe/webhook`
4. Primer deploy en Vercel y verificar env vars
5. Cambiar a live mode solo tras 3 pagos test exitosos
