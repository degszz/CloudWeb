import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

interface SitePublishedEmailProps {
  siteName: string;
  publicUrl: string;
}

export function SitePublishedEmail({
  siteName,
  publicUrl,
}: SitePublishedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{siteName} ya está publicado</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>{siteName} está en línea</Heading>

          <Text style={paragraph}>
            Tu sitio acaba de publicarse. Cualquiera puede visitarlo
            ahora mismo en:
          </Text>

          <Link href={publicUrl} style={urlLink}>
            {publicUrl}
          </Link>

          <Text style={paragraph}>
            Cualquier cambio que hagas a partir de ahora se queda como
            borrador hasta que pidas a Lúa que vuelva a publicar.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: '#fbfbfa',
  fontFamily: 'Geist Sans, -apple-system, sans-serif',
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
  fontSize: '28px',
  fontWeight: 400,
  letterSpacing: '-0.02em',
  margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
  color: '#2f3437',
  fontSize: '16px',
  lineHeight: 1.6,
  margin: '0 0 20px',
};

const urlLink: React.CSSProperties = {
  color: '#1f6c9f',
  fontFamily: 'Geist Mono, monospace',
  fontSize: '15px',
  display: 'block',
  margin: '0 0 24px',
  wordBreak: 'break-all',
};
