import { Skeleton } from '@/components/ui/States';

export default function AuditoriaLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-32" />
      <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
