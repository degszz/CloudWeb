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
 * Contact — variante "address-hours".
 *
 * Información de contacto a la izquierda (eyebrow, título, intro),
 * datos estructurados a la derecha (dirección, teléfono, email, horarios).
 *
 * Layout de dos columnas (md+). En mobile se apila.
 */
export default function ContactAddressHours({ id, props }: BlockProps) {
  const parsed = contactPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: ContactProps = parsed.data;

  return (
    <Section id={id} tone="canvas">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
          <div>
            {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
            <DisplayHeading size="md" className="mt-4">
              {data.title ?? 'Visítanos'}
            </DisplayHeading>
            {data.intro && <BodyText className="mt-5">{data.intro}</BodyText>}
          </div>

          <dl className="space-y-8 text-base">
            {data.address && (
              <div className="flex gap-4">
                <Icon
                  name="map-pin"
                  size={20}
                  weight="bold"
                  className="mt-1 shrink-0 text-ink-mute"
                />
                <div>
                  <dt className="text-xs uppercase tracking-caps text-ink-mute">
                    Dirección
                  </dt>
                  <dd className="mt-1 text-ink">{data.address}</dd>
                </div>
              </div>
            )}

            {data.phone && (
              <div className="flex gap-4">
                <Icon
                  name="phone"
                  size={20}
                  weight="bold"
                  className="mt-1 shrink-0 text-ink-mute"
                />
                <div>
                  <dt className="text-xs uppercase tracking-caps text-ink-mute">
                    Teléfono
                  </dt>
                  <dd className="mt-1 text-ink">
                    <a
                      href={`tel:${data.phone.replace(/\s/g, '')}`}
                      className="hover:text-ink-strong"
                    >
                      {data.phone}
                    </a>
                  </dd>
                </div>
              </div>
            )}

            {data.email && (
              <div className="flex gap-4">
                <Icon
                  name="envelope"
                  size={20}
                  weight="bold"
                  className="mt-1 shrink-0 text-ink-mute"
                />
                <div>
                  <dt className="text-xs uppercase tracking-caps text-ink-mute">
                    Email
                  </dt>
                  <dd className="mt-1 text-ink">
                    <a
                      href={`mailto:${data.email}`}
                      className="hover:text-ink-strong"
                    >
                      {data.email}
                    </a>
                  </dd>
                </div>
              </div>
            )}

            {data.hours && data.hours.length > 0 && (
              <div className="flex gap-4">
                <Icon
                  name="clock"
                  size={20}
                  weight="bold"
                  className="mt-1 shrink-0 text-ink-mute"
                />
                <div>
                  <dt className="text-xs uppercase tracking-caps text-ink-mute">
                    Horario
                  </dt>
                  <dd className="mt-1 space-y-1 text-ink">
                    {data.hours.map((row, idx) => (
                      <div key={idx} className="flex justify-between gap-8">
                        <span className="text-ink-mute">{row.days}</span>
                        <span className="font-mono text-sm">{row.hours}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      </Container>
    </Section>
  );
}
