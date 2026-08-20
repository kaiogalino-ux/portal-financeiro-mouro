import { Skeleton } from '@/components/ui/States';

export default function FluxoDeCaixaLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
