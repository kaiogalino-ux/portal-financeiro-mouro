import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brass font-display text-xl font-bold text-bg">
          M
        </span>
        <h1 className="font-display text-2xl text-ink">Mouro Soluções</h1>
        <p className="text-sm text-muted">Portal Financeiro</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
