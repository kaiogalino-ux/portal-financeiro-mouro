import { Skeleton } from '@/components/ui/States';

export default function NotasEmitidasLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-44" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
