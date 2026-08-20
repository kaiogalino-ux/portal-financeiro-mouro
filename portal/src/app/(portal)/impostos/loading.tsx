import { Skeleton } from '@/components/ui/States';

export default function ImpostosLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-32" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
