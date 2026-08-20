import { Skeleton } from '@/components/ui/States';

export default function UsuariosLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-40 w-full" />
      <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
