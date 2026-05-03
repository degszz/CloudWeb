import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  /** Email del usuario que acaba de registrarse */
  userEmail: string;
  /** URL al dashboard donde empezar el primer proyecto */
  dashboardUrl: string;
}

/**
 * Email de bienvenida. Personal, breve, sin clichés ("Eleva", "Seamless"...).
 * El founder lee y responde a cualquier respuesta.
 */
export function WelcomeEmail({ userEmail, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu cuenta de CloudWeb está lista</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Bienvenida a CloudWeb</Heading>

          <Text style={paragraph}>
            Has creado tu cuenta con <strong>{userEmail}</strong>. Cuando
            entres por primera vez, Lúa (la asistente del builder) te
            preguntará qué quieres crear y montará una primera versión
            contigo en menos de cinco minutos.
          </Text>

          <Section style={ctaSection}>
            <Link href={dashboardUrl} style={cta}>
              Empezar mi sitio
            </Link>
          </Section>

          <Text style={paragraph}>
            Tienes 14 días de prueba sin necesidad de introducir tarjeta.
            Si en ese tiempo lo lanzas y te resulta útil, podrás pasar a
            plan de pago desde Ajustes.
          </Text>

          <Text style={signature}>
            Si te encallas en algo, responde a este email. Lo leo yo.
            <br />— el equipo de CloudWeb
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos inline (requisito de email HTML)
const body: React.CSSProperties = {
  backgroundColor: '#fbfbfa',
  fontFamily: 'Geist Sans, -apple-system, "Helvetica Neue", sans-serif',
  margin: 0,
  padding: '40px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #eaeaea',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '40px',
};

const h1: React.CSSProperties = {
  color: '#111111',
  fontFamily: 'Instrument Serif, Georgia, serif',
  fontSize: '32px',
  fontWeight: 400,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
  color: '#2f3437',
  fontSize: '16px',
  lineHeight: 1.6,
  margin: '0 0 20px',
};

const ctaSection: React.CSSProperties = {
  margin: '32px 0',
};

const cta: React.CSSProperties = {
  backgroundColor: '#111111',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  padding: '12px 24px',
  textDecoration: 'none',
};

const signature: React.CSSProperties = {
  borderTop: '1px solid #eaeaea',
  color: '#787774',
  fontSize: '14px',
  marginTop: '32px',
  paddingTop: '24px',
};
