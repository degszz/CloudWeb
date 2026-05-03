export default function BuilderLoading() {
  return (
    <div className="flex h-[calc(100vh-65px)] animate-pulse">
      {/* Chat skeleton */}
      <div className="hidden w-[33%] border-r border-line md:block">
        <div className="border-b border-line px-6 py-4">
          <div className="h-3 w-16 rounded-sm bg-surface-bone" />
          <div className="mt-2 h-6 w-12 rounded-sm bg-surface-bone" />
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="h-4 w-3/4 rounded-sm bg-surface-bone" />
          <div className="h-4 w-1/2 rounded-sm bg-surface-bone" />
        </div>
      </div>

      {/* Preview skeleton */}
      <div className="flex-1 p-6">
        <div className="h-full rounded-lg border border-line bg-surface-bone" />
      </div>
    </div>
  );
}
