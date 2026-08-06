'use client';

import { useState } from 'react';
import { toggleUsuarioAtivoAction } from '@/actions/usuarios.actions';

export function UsuarioAtivoToggle({ userId, active }: { userId: string; active: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await toggleUsuarioAtivoAction(userId, !active);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-brass underline underline-offset-2 disabled:opacity-50"
    >
      {active ? 'Desativar' : 'Ativar'}
    </button>
  );
}
