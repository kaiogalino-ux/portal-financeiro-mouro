import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/auth';
import { prisma } from '@/server/db/prisma';
import { readableResources } from '@/shared/constants/roles';
import { PortalShell } from '@/components/layout/PortalShell';
import { TooltipProvider } from '@/components/ui/Tooltip';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.active) redirect('/login');

  const ultimoSync = await prisma.syncRun.findFirst({
    where: { status: { in: ['SUCESSO', 'PARCIAL'] } },
    orderBy: { finishedAt: 'desc' },
    select: { finishedAt: true },
  });

  return (
    <TooltipProvider>
      <PortalShell
        userName={session.user.name}
        role={session.user.role}
        lastSyncAt={ultimoSync?.finishedAt ? ultimoSync.finishedAt.toISOString() : null}
        allowedResources={Array.from(readableResources(session.user.role))}
      >
        {children}
      </PortalShell>
    </TooltipProvider>
  );
}
