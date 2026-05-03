---
name: automation-forge
description: Diseña y construye automatizaciones con IA usando n8n, Make, Zapier, Pipedream o código directo. Conecta APIs, agentes IA, bases de datos y mensajería para eliminar trabajo manual. Usar cuando el usuario pida "automatizar X", "conectar [app A] con [app B]", "flujo de trabajo automático", "agente IA", "bot que hace X", "webhook", "integración" o quiera reducir tareas repetitivas. Entrega flow diagram + JSON import + instrucciones de setup.
---

# Automation Forge

Automatizaciones que sobreviven en producción. No "drag and drop de feliz cumpleaños": flujos con manejo de errores, reintentos, logs y ROI medible.

## Principios

1. **Automatiza lo repetitivo, aburrido y de alto volumen**. Si pasa 3 veces al mes, no merece la pena automatizar.
2. **ROI en horas, no en "me parece guay"**. Calcula: (horas ahorradas × $/hora) - costo tool. Si es negativo, no lo hagas.
3. **Atomicidad**: un flujo hace UNA cosa bien. Flujos macro de 40 pasos fallan y nadie los debuggea.
4. **Idempotencia**: el flujo debe poder re-ejecutarse sin crear duplicados.
5. **Observabilidad**: cada flujo loguea a algún sitio (Airtable, Sheets, Discord).

## Decisión de herramienta

| Caso | Herramienta |
|---|---|
| No-code, <10 pasos, triggers estándar | **Zapier** |
| Lógica media, presupuesto ajustado | **Make (Integromat)** |
| Self-host, flujos complejos, IA agentes | **n8n** |
| Code-first, dev que quiere control total | **Pipedream** / código |
| Cientos de miles de runs/mes | **Código + cola** (Inngest, Trigger.dev) |
| Agentes IA conversacionales | **LangGraph / LlamaIndex + código** |

Regla: si puedes hacerlo en Zapier y se ejecuta <1000 veces/mes, hazlo en Zapier. No sobreingenierices.

## Flujo de trabajo

### Fase 1 — Descubrimiento

1. ¿Qué proceso repetitivo? (describe paso a paso)
2. ¿Quién lo hace hoy y cuánto tarda por ejecución?
3. ¿Qué apps entran? (input) ¿Qué apps salen? (output)
4. ¿Con qué frecuencia? (trigger: tiempo, evento, manual)
5. ¿Qué pasa si falla? ¿Quién necesita enterarse?
6. ¿Datos sensibles implicados? (GDPR, PII)

### Fase 2 — Diseño de flujo

Dibuja el flujo antes de construir. Formato:

```
[TRIGGER] → [FILTRO] → [TRANSFORMACIÓN] → [ACCIÓN] → [LOG]
                ↓ error
            [NOTIFICAR]
```

Identifica:
- **Trigger**: cron, webhook, app event, manual
- **Filtros**: condiciones para que el flujo siga (evita ejecuciones innecesarias)
- **Transformaciones**: formateo, cálculos, llamadas a IA
- **Acciones**: qué se crea/actualiza/envía
- **Error handling**: qué hacer si cada paso falla
- **Logging**: dónde queda rastro

### Fase 3 — Patrones comunes

#### Patrón 1: Captura lead → CRM → notificación
```
Typeform submit
  → Enriquecer con Clearbit/Apollo
  → Clasificar con OpenAI (hot/warm/cold)
  → Crear en HubSpot + asignar owner
  → Slack al owner si hot
  → Email nurturing si warm
  → Newsletter si cold
```

#### Patrón 2: Email → Resumen IA → Tarea
```
Gmail label "to-triage"
  → Extraer body
  → OpenAI: resumir + clasificar + urgencia
  → Crear task en Notion/Linear con prioridad
  → Si urgente: Slack DM
  → Archivar email
```

#### Patrón 3: RSS → IA → Redes sociales
```
RSS nuevo post
  → OpenAI: generar 3 variantes (Twitter, LinkedIn, threads)
  → Review humana en Airtable (manual approval)
  → Al aprobar: schedule en Buffer/Typefully
  → Log en Sheets
```

#### Patrón 4: Voz → Transcripción → Resumen → CRM
```
Fathom/Otter call finalizada
  → Transcript webhook
  → OpenAI: extraer action items, objections, next steps
  → Update deal en HubSpot
  → Tarea en Linear con action items
  → Email al cliente con recap
```

#### Patrón 5: Soporte inteligente
```
Ticket Intercom/Help Scout
  → Vectorize con knowledge base (Pinecone/Supabase)
  → RAG: buscar respuestas similares
  → OpenAI: redacta borrador de respuesta
  → Agente humano: aprueba/edita/envía
  → Si respuesta nueva: añadir a KB
```

#### Patrón 6: E-commerce auto-rescate carrito
```
Shopify cart abandoned
  → Esperar 1h
  → Email 1: "Olvidaste algo"
  → Esperar 24h (si no compra)
  → Email 2: "10% código"
  → Esperar 48h
  → Email 3 + anuncio Meta retargeting
  → Si compra en cualquier momento: salir del flujo
```

#### Patrón 7: Reporting semanal auto
```
Cron lunes 9:00
  → Consultar Stripe (MRR, churn, new customers)
  → Consultar Posthog (active users, retention)
  → Consultar Supabase (datos dominio)
  → OpenAI: generar narrativa + insights
  → Crear en Notion como página semanal
  → Slack al equipo
```

### Fase 4 — Agentes IA (nivel avanzado)

Cuando la automatización requiere **decisión**, no secuencia fija, usa agentes.

Framework mental:
- **Tools** que el agente puede invocar (APIs, functions)
- **Memory** (vector store para contexto largo)
- **Planner** (LLM decide next step)
- **Observer** (loguea decisiones para debug)

Ejemplo: Agente de prospecting outbound
```
Tools:
  - apollo_search(criteria) → leads
  - enrich_lead(email) → full profile
  - generate_email(lead, context) → draft
  - send_email(draft) → sent
  - log_activity(lead, action)

Prompt del agente:
"Eres un SDR. Cada día debes:
1. Buscar 20 leads que cumplan ICP [...]
2. Filtrar los que ya contactamos (consulta HubSpot)
3. Generar email personalizado basado en su LinkedIn
4. Enviar máx 50/día
5. Loguear todo
Si encuentras empresa fit pero sin email, busca 3 compañeros suyos."
```

Código típico con LangGraph o AI SDK. Pero antes de meter agente, pregúntate: ¿puedo resolverlo con reglas determinísticas + 1 call a LLM?

### Fase 5 — Manejo de errores

Cada flujo necesita:

- **Reintentos** con exponential backoff (3 intentos, 2s/8s/32s)
- **Dead letter queue**: si falla definitivamente, va a Airtable/Sheet para revisión manual
- **Notificación al owner**: Slack/email si falla crítico
- **Idempotency key**: hash del input para evitar ejecutar 2x lo mismo
- **Timeouts**: cada step tiene límite, no dejes colgar

### Fase 6 — Cálculo de ROI

Antes de construir, valida:

```
Horas ahorradas/mes = (nº ejecuciones) × (minutos ahorrados) / 60
Valor horas = horas × $/hora del que lo hace
Coste automatización = tool mensual + horas de construcción amortizadas / 12
ROI = (valor horas - coste) × 12
Payback = horas construcción / horas ahorradas mensuales
```

Si el payback es >3 meses, busca alternativa más simple.

## Anti-patrones

- Flujo con 40 pasos en Zapier (caro, frágil, indebugeable)
- Sin logs: cuando falla, no sabes qué pasó
- Sin filtros: gastas executions en ejecuciones inútiles
- Hardcodear emails/IDs (usa variables de entorno / tables lookup)
- Usar IA para lo que una regla if/else resuelve
- No testear con datos edge: emails raros, strings con emojis, timezones
- Automatizar sin confirmar con el stakeholder que el proceso actual es correcto (automatizar el caos escala el caos)
- No documentar: en 3 meses nadie se acuerda de cómo funciona

## Seguridad

- **Tokens en secretos**, nunca hardcodeados
- **Principio de menor privilegio**: el token solo hace lo imprescindible
- **No loguear PII completa**: trunca/hashea emails en logs
- **GDPR**: si el flujo procesa datos EU, considera región del proveedor
- **Webhooks**: valida firma/secret antes de procesar
- **Rate limits**: respeta los de cada API, añade delays

## Checklist por flujo

- [ ] Trigger definido y testeado
- [ ] Filtros evitan ejecuciones innecesarias
- [ ] Cada paso tiene manejo de error
- [ ] Logs en un sitio centralizado
- [ ] Notificación de fallos al owner
- [ ] Idempotencia garantizada (no duplica en reintentos)
- [ ] Documentado en README o Notion del equipo
- [ ] Variables/secretos gestionados, no hardcoded
- [ ] Probado con 3 casos normales + 2 casos edge
- [ ] ROI calculado y positivo

## Entregables

Genera:
1. **Diagrama del flujo** (ASCII o Mermaid)
2. **Lista de apps/cuentas necesarias**
3. **JSON de import** (n8n/Make) o steps detallados (Zapier)
4. **Prompts de IA** si hay nodes LLM (con system + user + ejemplos)
5. **README** con setup paso a paso
6. **Plan de testing** (qué probar antes de dejar en producción)
