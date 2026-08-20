import { Suspense } from 'react';
import { MouroMark } from '@/components/brand/MouroMark';
import { EsqueciSenhaForm } from '@/components/auth/EsqueciSenhaForm';

export default function EsqueciSenhaPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <span className="mx-auto mb-4 flex justify-center">
          <MouroMark size={48} tema="auto" />
        </span>
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.03em] text-ink">
          Mouro <span className="text-brass">Soluções</span>
        </h1>
        <p className="text-sm text-muted">Recuperar senha</p>
      </div>
      <Suspense>
        <EsqueciSenhaForm />
      </Suspense>
    </div>
  );
}
