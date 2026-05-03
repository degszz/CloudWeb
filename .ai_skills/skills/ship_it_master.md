---
name: ship-it
description: Despliega cualquier proyecto a producción: dominio, SSL, hosting, CI/CD, analytics, monitoring y legales. Usar cuando el usuario pida "desplegar", "subir a producción", "lanzar a internet", "conectar dominio", "poner online", "ship", "deploy" o esté terminando un proyecto y necesite llevarlo a usuarios reales. Cubre Vercel/Netlify/Cloudflare, dominios, DNS, SSL, pixel de analytics, Sentry, RGPD y Product Hunt.
---

# Ship It

Del localhost a usuarios reales. Lista completa para que nada se quede a medias en el lanzamiento.

## Filosofía

"Ship" no es "subir código a un servidor". Ship es que un desconocido en otro continente pueda usar tu producto, pagar, y que tú te enteres si algo falla.

## Los 10 bloques del ship

### 1. Hosting del frontend / app

| Tipo | Mejor opción | Por qué |
|---|---|---|
| Next.js / React / Vue | **Vercel** | Deploy por git push, preview envs, Edge runtime |
| Sitio estático (Astro, HTML) | **Cloudflare Pages** o **Netlify** | Gratis + CDN global + sin cold start |
| Backend Node/Python persistente | **Railway** o **Fly.io** | Contenedores, volúmenes, regiones múltiples |
| Edge functions globales | **Cloudflare Workers** | Sub-50ms latencia global |
| Mobile | **Expo EAS** | Build + OTA updates |

Setup Vercel en 60 segundos:
```bash
npm i -g vercel
vercel          # primera vez: login + link project
vercel --prod   # deploy a producción
```

### 2. Base de datos

| Caso | Opción |
|---|---|
| SaaS con auth | **Supabase** (Postgres + auth + storage + RLS) |
| Solo DB | **Neon** (serverless Postgres) o **PlanetScale** (MySQL) |
| Realtime | **Supabase** o **Convex** |
| Vector (RAG) | **Supabase pgvector** o **Pinecone** |
| KV cache | **Upstash Redis** |

Nunca uses SQLite en serverless. Nunca uses Postgres self-hosted para un MVP.

### 3. Dominio y DNS

**Registrars recomendados**:
- **Porkbun** (más baratos, buena UI)
- **Cloudflare Registrar** (precio coste, DNS gratis)
- **Namecheap** (clásico, decente)

Evita GoDaddy (upsells agresivos, caro).

**Setup típico** (dominio → Vercel):
1. Comprar dominio
2. En Vercel: Settings → Domains → Add
3. En registrar: añadir los DNS records que Vercel te dice:
   - `A` record: `@` → `76.76.21.21`
   - `CNAME`: `www` → `cname.vercel-dns.com`
4. Esperar propagación (5 min - 24h, normalmente <30 min)
5. SSL automático (Let's Encrypt, Vercel lo maneja)

**Configuración DNS esencial adicional**:
- `MX` para email si usas Google Workspace / ImprovMX
- `TXT` SPF: `v=spf1 include:_spf.google.com ~all`
- `TXT` DMARC: `v=DMARC1; p=none; rua=mailto:tu@dominio.com`
- `TXT` DKIM: el que te da tu proveedor de email
- `CAA` record para restringir qué CA puede emitir SSL (opcional)

### 4. Emails transaccionales + marketing

- **Transaccional** (signup, password reset, recibos): **Resend** (moderno, React Email) o **Postmark** (fiable)
- **Marketing** (newsletters, secuencias): **Loops**, **ConvertKit**, **Customer.io**, **Beehiiv**
- **Forms**: **Formspree**, **Tally**, **Typeform**

Configura desde el día 1:
- SPF + DKIM + DMARC (sin estos caes en spam)
- From address con tu dominio, no `@gmail.com`
- Un subdomain para marketing (`mail.tudominio.com`) separado del transaccional (`app.tudominio.com`) — si uno se quema, el otro sobrevive

### 5. Analytics

No instales Google Analytics por defecto. Opciones mejores:

- **Plausible** o **Fathom**: privacy-first, cookieless, <1kb script
- **Posthog**: analytics + product + feature flags + replays (gratis self-host)
- **Mixpanel** / **Amplitude**: product analytics avanzado (eventos custom)

Instala 2 cosas:
1. Page analytics (Plausible)
2. Product events (Posthog): `signup`, `activation`, `paid`, `key_action`

### 6. Monitoring y errores

- **Sentry**: errores frontend + backend con stack traces
- **BetterStack** / **Uptime Robot**: uptime monitoring
- **Logtail** / **Axiom**: log aggregation
- **Cronitor**: monitoring de cron jobs

Alertas a Slack/Discord — no al email, se pierden.

### 7. CI/CD

Vercel y Netlify dan CI/CD automático por git push. Si necesitas más:

**GitHub Actions mínimo**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

Pre-commit hooks con **lefthook** o **husky**:
- `lint-staged` para formatear solo archivos cambiados
- `typecheck` antes de commit

### 8. Seguridad básica

- [ ] HTTPS forzado (Vercel/Netlify: default)
- [ ] Headers de seguridad (HSTS, X-Frame-Options, CSP). `vercel.json`:
  ```json
  { "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]
  }]}
  ```
- [ ] Rate limiting (Upstash Ratelimit o Vercel Edge Config)
- [ ] Env vars en el panel del proveedor, NUNCA en git
- [ ] Rotar claves si han estado en repo
- [ ] WAF de Cloudflare (gratis plan) si estás detrás

### 9. Legales (sin abogado en MVP)

Obligatorio antes de aceptar usuarios:

- [ ] **Términos y Condiciones**
- [ ] **Política de Privacidad** (GDPR si hay usuarios EU)
- [ ] **Política de Cookies** + banner (Cookiebot, Osano, o build propio)
- [ ] **Aviso Legal** (en España: Ley LSSI)
- [ ] Si cobras: **política de reembolso/devolución**

Generadores razonables (luego revisar con abogado cuando factures):
- **Termly**, **iubenda**, **FreePrivacyPolicy**

Para banner de cookies: solo necesitas consent si usas analytics con cookies o pixels de ads. Si usas Plausible y nada más: no banner necesario.

### 10. Launch

**Pre-launch (7 días antes)**:
- [ ] Beta privada con 20-50 usuarios warm
- [ ] Preparar assets: imagen 1200x630, vídeo demo <60s, descripciones cortas y largas
- [ ] Lista de 100 personas a notificar personalmente (no blast)
- [ ] Email al founder cuando alguien se registre (te mantiene en contacto con realidad)

**Canales de launch**:
- **Product Hunt**: solo cuando tengas tracción + comunidad. Lanza martes-jueves, 00:01 PT.
- **Hacker News**: "Show HN: [nombre] – [descripción en una línea]". Responde a cada comentario.
- **Twitter/X**: thread con problema → solución → demo → ask
- **LinkedIn**: post personal, no de la página
- **Reddit**: subreddits del nicho, post honesto, no spammy
- **Comunidades Slack/Discord** del nicho
- **IndieHackers**, **BetaList**, **AppSumo Marketplace**

**Post-launch (primer mes)**:
- Respuesta en <2h a todo usuario
- Changelog público semanal
- 5 calls con early adopters
- Iterar basado en fricción, no en features pedidas

## Checklist completo pre-producción

### Tecnológico
- [ ] Dominio con SSL
- [ ] Deploy en producción funcionando
- [ ] DB con backup automático
- [ ] Variables de entorno en panel (no en git)
- [ ] Errores monitoreados (Sentry)
- [ ] Uptime monitoreado
- [ ] Logs accesibles

### Producto
- [ ] Signup → primer valor en <3 min
- [ ] Email de bienvenida funciona
- [ ] Flujo de pago testeado end-to-end
- [ ] Mobile responsive verificado en iPhone y Android real
- [ ] Lighthouse score >85 performance
- [ ] PageSpeed Insights verde
- [ ] Funciona en Safari (no solo Chrome)

### Analytics
- [ ] Page analytics funcionando
- [ ] Evento de activación medido
- [ ] Evento de conversión medido
- [ ] Dashboard listo (Posthog, GA, Plausible)

### Legal / operacional
- [ ] Términos, Privacidad, Cookies publicados
- [ ] Emails SPF/DKIM/DMARC configurados
- [ ] Dirección de soporte publicada y monitoreada
- [ ] Página de status (statuspage.io o similar) — opcional en MVP

### Marketing / lanzamiento
- [ ] Landing con CTA claro
- [ ] Open Graph images testadas en Slack/WhatsApp/Twitter
- [ ] Redes sociales reservadas (misma marca)
- [ ] Email del founder al primer cliente pre-escrito
- [ ] Lista de 100 personas a notificar lista

## Anti-patrones

- Lanzar sin SSL
- Usar `localhost` en vars de entorno en producción
- Sin monitoring: te enteras de los bugs por tu madre
- Lanzar en Product Hunt sin audiencia previa (mueres en posición 15)
- Analytics con Google Analytics 4 + banner enorme de cookies y nada más medido
- Sin backup de DB
- Guardar API keys en el repo (aunque sea privado)
- Subir `node_modules` o `.env`
- Deploy a "main" directo sin preview/staging para cambios de riesgo
- Nombre del producto en el dominio sin reservar las redes sociales primero

## Tras el ship

Primer día:
- Refresca métricas cada 2h, no cada 30s
- Responde a cada usuario personalmente
- Anota cada bug/fricción en un único doc
- No toques el código salvo bugs críticos

Primera semana:
- 5 calls de 15 min con usuarios activos
- Post-mortem del launch: qué funcionó, qué no
- Decidir 1 experimento de growth para la semana 2
