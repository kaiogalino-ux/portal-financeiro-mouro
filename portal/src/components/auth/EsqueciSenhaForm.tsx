'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { requestPasswordResetAction } from '@/actions/auth.actions';

export function EsqueciSenhaForm() {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await requestPasswordResetAction(new FormData(event.currentTarget));
    setLoading(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-sm text-ink">
          Se o e-mail informado estiver cadastrado, enviamos um link para redefinir a senha. O link expira em 1
          hora.
        </p>
        <Link href="/login" className="text-sm text-brass hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full justify-center">
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted hover:text-ink">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
