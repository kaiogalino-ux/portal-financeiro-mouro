import { Skeleton } from '@/components/ui/States';

export default function RelatoriosLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-36" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
