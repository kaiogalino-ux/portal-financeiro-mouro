import { Skeleton } from '@/components/ui/States';

export default function ContasAReceberLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-48" />
      <Skeleton className="mb-4 h-[70px] w-full" />
      <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
