import type { Config } from 'tailwindcss';

/**
 * Tailwind como motor, pero los tokens vienen de src/styles/tokens.css
 * para que minimalist_ui sea la única fuente de verdad estética.
 *
 * Esto significa que las clases color/font/shadow estándar de Tailwind
 * están deshabilitadas o sobreescritas: usamos siempre las del proyecto.
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/blocks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        'canvas-pure': 'var(--canvas-pure)',
        surface: 'var(--surface)',
        'surface-warm': 'var(--surface-warm)',
        'surface-bone': 'var(--surface-bone)',
        ink: 'var(--ink)',
        'ink-strong': 'var(--ink-strong)',
        'ink-mute': 'var(--ink-mute)',
        'ink-faint': 'var(--ink-faint)',
        line: 'var(--line)',
        'line-hard': 'var(--line-hard)',
        'line-soft': 'var(--line-soft)',
        'accent-red-bg': 'var(--accent-red-bg)',
        'accent-red-fg': 'var(--accent-red-fg)',
        'accent-blue-bg': 'var(--accent-blue-bg)',
        'accent-blue-fg': 'var(--accent-blue-fg)',
        'accent-green-bg': 'var(--accent-green-bg)',
        'accent-green-fg': 'var(--accent-green-fg)',
        'accent-yellow-bg': 'var(--accent-yellow-bg)',
        'accent-yellow-fg': 'var(--accent-yellow-fg)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        // Intencionalmente sin lg/xl/2xl/inner: minimalist_ui los prohíbe
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        caps: 'var(--tracking-caps)',
      },
      lineHeight: {
        body: 'var(--leading-body)',
        display: '1.1',
      },
      maxWidth: {
        prose: '65ch',
        // Anchos preferidos del skill
        editorial: '64rem',  // ~max-w-4xl
        canvas: '80rem',     // ~max-w-5xl
      },
    },
  },
  plugins: [],
};

export default config;
