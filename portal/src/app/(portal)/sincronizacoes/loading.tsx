import { Skeleton } from '@/components/ui/States';

export default function SincronizacoesLoading() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="mb-4 h-10 w-56" />
      <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
