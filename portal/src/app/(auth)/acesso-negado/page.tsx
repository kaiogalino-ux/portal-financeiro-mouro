import Link from 'next/link';

export default function AcessoNegadoPage() {
  return (
    <div className="text-center">
      <h1 className="font-display text-2xl text-ink">Acesso não autorizado</h1>
      <p className="mt-2 text-sm text-muted">Seu perfil não tem permissão para acessar esta área.</p>
      <Link href="/dashboard" className="mt-4 inline-block text-sm text-brass underline underline-offset-2">
        Voltar para o painel
      </Link>
    </div>
  );
}
