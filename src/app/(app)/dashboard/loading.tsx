/**
 * Skeleton de carga del dashboard.
 * Aparece mientras el Server Component carga profile, site y suscripción.
 */
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-canvas px-6 py-16 md:py-24">
      <div className="max-w-editorial animate-pulse">
        <div className="h-3 w-20 rounded-sm bg-surface-bone" />
        <div className="mt-6 h-12 w-3/4 rounded-sm bg-surface-bone" />
        <div className="mt-4 h-5 w-1/2 rounded-sm bg-surface-bone" />

        <div className="mt-16 rounded-lg border border-line bg-surface p-8">
          <div className="h-4 w-48 rounded-sm bg-surface-bone" />
          <div className="mt-4 h-3 w-32 rounded-sm bg-surface-bone" />
          <div className="mt-8 h-10 w-36 rounded-sm bg-surface-bone" />
        </div>
      </div>
    </main>
  );
}
