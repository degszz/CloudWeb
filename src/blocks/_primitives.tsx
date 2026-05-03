import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Primitivas visuales compartidas por TODOS los bloques.
 *
 * Aplican las reglas de minimalist_ui.md por construcción:
 *   - Macro-espaciado: py-24 / py-32
 *   - Anchos editoriales: max-w-editorial / max-w-canvas
 *   - Tipografía display con tracking ajustado y leading 1.1
 *   - Sin sombras pesadas, sin gradientes, sin emojis
 *
 * Cualquier bloque debe construirse a partir de estas piezas.
 * Si necesitas algo que no está aquí, AÑÁDELO AQUÍ — no lo dupliques
 * en el bloque. Es la única forma de mantener coherencia visual.
 */

// =========================================================================
// <Section> — wrapper estándar con padding vertical macro
// =========================================================================
interface SectionProps {
  children: ReactNode;
  /** Tono de fondo. Default: canvas (off-white cálido). */
  tone?: 'canvas' | 'pure' | 'bone';
  /** Espaciado vertical. Default: standard (py-24 / md:py-32). */
  spacing?: 'standard' | 'compact';
  className?: string;
  id?: string;
}

const TONE_CLASS = {
  canvas: 'bg-canvas',
  pure: 'bg-canvas-pure',
  bone: 'bg-surface-bone',
};

const SPACING_CLASS = {
  standard: 'py-24 md:py-32',
  compact: 'py-16 md:py-20',
};

export function Section({
  children,
  tone = 'canvas',
  spacing = 'standard',
  className,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(TONE_CLASS[tone], SPACING_CLASS[spacing], className)}
    >
      {children}
    </section>
  );
}

// =========================================================================
// <Container> — restringe ancho y aplica padding lateral
// =========================================================================
interface ContainerProps {
  children: ReactNode;
  /** editorial = max-w-4xl, canvas = max-w-5xl. Default canvas. */
  width?: 'editorial' | 'canvas';
  className?: string;
}

export function Container({
  children,
  width = 'canvas',
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto px-6',
        width === 'editorial' ? 'max-w-editorial' : 'max-w-canvas',
        className
      )}
    >
      {children}
    </div>
  );
}

// =========================================================================
// <Eyebrow> — texto pequeño, mayúsculas, encima de un titular
// =========================================================================
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-caps text-ink-mute">
      {children}
    </p>
  );
}

// =========================================================================
// <DisplayHeading> — titular editorial en serif
// =========================================================================
interface DisplayHeadingProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const HEADING_SIZE = {
  sm: 'text-3xl md:text-4xl',
  md: 'text-4xl md:text-5xl',
  lg: 'text-5xl md:text-6xl',
  xl: 'text-6xl md:text-7xl',
};

export function DisplayHeading({
  children,
  as = 'h2',
  size = 'md',
  className,
}: DisplayHeadingProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        'font-display tracking-display text-ink-strong leading-display',
        HEADING_SIZE[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}

// =========================================================================
// <BodyText> — párrafo de cuerpo
// =========================================================================
interface BodyTextProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BODY_SIZE = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function BodyText({ children, size = 'md', className }: BodyTextProps) {
  return (
    <p
      className={cn(
        'text-ink leading-body max-w-prose',
        BODY_SIZE[size],
        className
      )}
    >
      {children}
    </p>
  );
}

// =========================================================================
// <PrimaryButton> — CTA principal (negro sólido, sin sombra)
// =========================================================================
interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function PrimaryButton({ href, children, className }: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-sm bg-ink-strong px-5 py-3 text-sm text-canvas-pure',
        'transition-all duration-200 hover:bg-[#333333] active:scale-[0.98]',
        className
      )}
    >
      {children}
    </a>
  );
}

// =========================================================================
// <SecondaryLink> — CTA secundario, plano
// =========================================================================
export function SecondaryLink({ href, children, className }: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-ink-mute transition-colors hover:text-ink-strong',
        className
      )}
    >
      {children}
    </a>
  );
}

// =========================================================================
// <Tag> — píldora pastel para acentos (status, categoría)
// =========================================================================
interface TagProps {
  children: ReactNode;
  tone?: 'red' | 'blue' | 'green' | 'yellow' | 'neutral';
}

const TAG_TONE = {
  red: 'bg-accent-red-bg text-accent-red-fg',
  blue: 'bg-accent-blue-bg text-accent-blue-fg',
  green: 'bg-accent-green-bg text-accent-green-fg',
  yellow: 'bg-accent-yellow-bg text-accent-yellow-fg',
  neutral: 'bg-surface-bone text-ink-mute',
};

export function Tag({ children, tone = 'neutral' }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-3 py-1 text-xs uppercase tracking-caps',
        TAG_TONE[tone]
      )}
    >
      {children}
    </span>
  );
}

// =========================================================================
// <Card> — superficie con borde 1px sólido + radius lg + padding generoso
// =========================================================================
interface CardProps {
  children: ReactNode;
  className?: string;
  /** Padding interno. Default: standard (p-8 md:p-10). */
  padding?: 'standard' | 'compact';
}

const CARD_PADDING = {
  standard: 'p-8 md:p-10',
  compact: 'p-6',
};

export function Card({ children, padding = 'standard', className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface',
        CARD_PADDING[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

// =========================================================================
// <Divider> — línea sutil
// =========================================================================
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line', className)} />;
}
