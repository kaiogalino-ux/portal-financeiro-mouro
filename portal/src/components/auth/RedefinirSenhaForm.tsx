'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { resetPasswordAction } from '@/actions/auth.actions';

export function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setLoading(true);

    const result = await resetPasswordAction(new FormData(event.currentTarget));

    setLoading(false);
    if (!result.ok) {
      setErro(result.error);
      return;
    }
    router.push('/login?redefinida=1');
  }

  if (!token) {
    return (
      <p className="max-w-sm text-center text-sm text-alert">
        Link inválido. Solicite um novo em{' '}
        <Link href="/esqueci-senha" className="text-brass hover:underline">
          Esqueci minha senha
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-muted">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm text-muted">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass"
        />
      </div>
      {erro && <p className="text-sm text-alert">{erro}</p>}
      <Button type="submit" disabled={loading} className="w-full justify-center">
        {loading ? 'Salvando...' : 'Redefinir senha'}
      </Button>
    </form>
  );
}
