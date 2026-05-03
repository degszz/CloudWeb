'use client';

import { useState, type FormEvent } from 'react';

import {
  BodyText,
  Container,
  DisplayHeading,
  Eyebrow,
  Section,
} from '@/blocks/_primitives';
import { Icon } from '@/components/ui/icon';
import {
  contactPropsSchema,
  type ContactProps,
} from '@/lib/builder/schemas/contact';

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

/**
 * Contact — variante "form-and-map".
 *
 * Formulario simple a la izquierda + placeholder de mapa con coordenadas
 * a la derecha. El form NO envía a un backend: construye un mailto: con
 * los datos rellenos y abre el cliente de email del visitante.
 *
 * Decisión MVP: sin integración con Google Maps / Mapbox / OSM. El bloque
 * muestra un placeholder visual con MapPin + coordenadas. La integración
 * de mapas reales es una mejora post-validación.
 */
export default function ContactFormAndMap({ id, props }: BlockProps) {
  const parsed = contactPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: ContactProps = parsed.data;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data.email) return;
    const subject = encodeURIComponent(`Mensaje de ${name || 'visitante'}`);
    const body = encodeURIComponent(
      `Nombre: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
  }

  return (
    <Section id={id} tone="canvas">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
          {/* Form */}
          <div>
            {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
            <DisplayHeading size="md" className="mt-4">
              {data.title ?? 'Hablemos'}
            </DisplayHeading>
            {data.intro && <BodyText className="mt-5">{data.intro}</BodyText>}

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <FormField label="Nombre">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="name"
                />
              </FormField>
              <FormField label="Tu email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="email"
                />
              </FormField>
              <FormField label="Mensaje">
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </FormField>
              <button
                type="submit"
                disabled={!data.email}
                className="inline-flex items-center gap-2 rounded-sm bg-ink-strong px-5 py-3 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.98] disabled:opacity-50"
              >
                {data.formCtaLabel ?? 'Enviar mensaje'}
                <Icon name="paper-plane" size={16} />
              </button>
              {!data.email && (
                <p className="text-xs text-ink-faint">
                  El email del destinatario no está configurado.
                </p>
              )}
            </form>
          </div>

          {/* Mapa placeholder */}
          <div>
            <div className="flex aspect-square flex-col items-center justify-center rounded-lg border border-line bg-surface-bone p-10 text-center md:aspect-auto md:h-full md:min-h-[420px]">
              <Icon
                name="map-pin"
                size={32}
                weight="bold"
                className="text-ink-mute"
              />
              {data.address && (
                <p className="mt-4 max-w-xs text-base text-ink">
                  {data.address}
                </p>
              )}
              {data.mapCenter && (
                <p className="mt-3 font-mono text-xs text-ink-faint">
                  {data.mapCenter.lat.toFixed(4)},{' '}
                  {data.mapCenter.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// =========================================================================
// Helpers locales
// =========================================================================
const INPUT_CLASS =
  'block w-full rounded-sm border border-line bg-surface px-3 py-3 text-sm text-ink-strong outline-none transition-colors focus:border-ink-strong';

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-caps text-ink-mute">
        {label}
      </span>
      {children}
    </label>
  );
}
