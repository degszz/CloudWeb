export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-editorial px-5 pb-20 pt-28 md:px-10 md:pb-32 md:pt-36">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
        Legal
      </p>
      <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-display text-ink-strong">
        Política de cookies
      </h1>
      <p className="mt-3 text-sm text-ink-faint">
        Última actualización: pendiente.
      </p>
      <div className="mt-10 max-w-prose text-base leading-body text-ink">
        <p>
          CloudWeb usa Plausible (analytics cookieless) por lo que no
          requiere banner de consentimiento. Las únicas cookies son las
          de sesión de Supabase, estrictamente necesarias para que el
          login funcione.
        </p>
      </div>
    </main>
  );
}
