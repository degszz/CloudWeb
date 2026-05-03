import { notFound } from 'next/navigation';

import { BuilderShell } from '@/components/builder/builder-shell';
import { PaywallBanner, GracePeriodBanner } from '@/components/builder/paywall-banner';
import { createServerClient } from '@/lib/supabase/server';
import { checkProductAccess } from '@/lib/subscription';
import { getPublishedUrl } from '@/lib/utils';

interface BuilderPageProps {
  params: Promise<{ siteId: string }>;
}

interface RawMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: unknown;
  created_at: string;
}

/**
 * Página principal del builder. Carga estado, conversación, mensajes,
 * verifica acceso por suscripción y monta el BuilderShell.
 */
export default async function BuilderPage({ params }: BuilderPageProps) {
  const { siteId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: site } = await supabase
    .from('sites')
    .select('id, slug, name, is_published')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!site) notFound();

  // Cargar conversación más reciente del site
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('site_id', site.id)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Cargar mensajes (solo user/assistant, no tool — irrelevantes para UI)
  const initialMessages: Array<{ id: string; role: 'user' | 'assistant'; text: string }> = [];
  if (conv) {
    const { data: rows } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    for (const row of (rows ?? []) as RawMessage[]) {
      if (row.role === 'tool') continue;
      const text = extractText(row.content);
      if (!text) continue; // assistants con solo tool_uses se omiten
      initialMessages.push({ id: row.id, role: row.role, text });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const previewUrl = `${appUrl}/builder/${site.id}/preview`;
  const publishedUrl = site.is_published ? getPublishedUrl(site.slug) : null;

  // Check de acceso
  const access = await checkProductAccess(user.id);
  const chatDisabled = !access.allowed;

  // Calcular horas restantes de grace period
  let graceHoursLeft = 24;
  if (access.allowed && access.reason === 'grace_period') {
    const { data: siteData } = await supabase
      .from('sites')
      .select('created_at')
      .eq('id', siteId)
      .single();
    if (siteData) {
      graceHoursLeft = Math.max(
        0,
        24 - (Date.now() - new Date(siteData.created_at).getTime()) / (1000 * 60 * 60)
      );
    }
  }

  return (
    <>
      {chatDisabled && <PaywallBanner />}
      {access.allowed && access.reason === 'grace_period' && (
        <GracePeriodBanner hoursLeft={graceHoursLeft} />
      )}
      <BuilderShell
        siteId={site.id}
        initialConversationId={conv?.id ?? null}
        initialMessages={initialMessages}
        previewUrl={previewUrl}
        publishedUrl={publishedUrl}
        chatDisabled={chatDisabled}
      />
    </>
  );
}

/**
 * Extrae el texto plano de un content de Anthropic.
 * Los content blocks pueden ser strings (raro), arrays de blocks, etc.
 */
function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      (block as { type: string }).type === 'text' &&
      'text' in block
    ) {
      parts.push((block as { text: string }).text);
    }
  }
  return parts.join('\n').trim();
}
