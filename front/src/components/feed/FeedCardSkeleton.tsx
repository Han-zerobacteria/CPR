export function FeedCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <div className="aspect-[4/5] animate-pulse bg-zinc-200" />
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-zinc-200" />
          <div className="h-4 w-28 rounded bg-zinc-200" />
        </div>
        <div className="h-4 w-4/5 rounded bg-zinc-200" />
        <div className="h-4 w-2/5 rounded bg-zinc-200" />
      </div>
    </article>
  );
}
