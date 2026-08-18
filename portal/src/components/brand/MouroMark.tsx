import Image from 'next/image';
import { cn } from '@/lib/cn';
import { SIMBOLO_NEGATIVO, SIMBOLO_POSITIVO } from './marcaAssets';

/** Proporção do recorte original (70x92). */
const PROPORCAO = 70 / 92;

/**
 * Símbolo "U" da marca Mouro — os pixels do logotipo oficial da empresa, não
 * um desenho aproximado. Ver public/marca/LEIA-ME.md.
 *
 * Vem em duas versões porque PNG não troca de cor: a negativa (branca) para
 * fundos escuros e a positiva para fundos claros. Use `tema="auto"` nas telas
 * que acompanham o tema; na sidebar, grafite nos dois temas, vale sempre a
 * negativa.
 */
export function MouroMark({
  size = 40,
  tema = 'negativo',
  className,
}: {
  size?: number;
  tema?: 'negativo' | 'positivo' | 'auto';
  className?: string;
}) {
  const largura = Math.round(size * PROPORCAO);

  if (tema !== 'auto') {
    return <Simbolo variante={tema} largura={largura} altura={size} className={className} />;
  }

  return (
    <span className={cn('block shrink-0', className)}>
      <Simbolo variante="negativo" largura={largura} altura={size} className="marca-tema-escuro" />
      <Simbolo variante="positivo" largura={largura} altura={size} className="marca-tema-claro" />
    </span>
  );
}

function Simbolo({
  variante,
  largura,
  altura,
  className,
}: {
  variante: 'negativo' | 'positivo';
  largura: number;
  altura: number;
  className?: string;
}) {
  return (
    <Image
      src={variante === 'negativo' ? SIMBOLO_NEGATIVO : SIMBOLO_POSITIVO}
      alt=""
      width={largura}
      height={altura}
      // Já está embutido em base64 — não há o que otimizar nem buscar.
      unoptimized
      className={className}
    />
  );
}
