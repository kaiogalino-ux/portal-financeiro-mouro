import { Skeleton } from '@/components/ui/States';

export default function ClientesLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-32" />
      <Skeleton className="mb-4 h-10 w-64" />
      <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
