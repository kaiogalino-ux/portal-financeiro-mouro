export const TIMEZONE = 'America/Sao_Paulo';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const monthLabelFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  month: 'short',
  year: '2-digit',
});

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatMonthLabel(value: Date | string): string {
  return monthLabelFormatter.format(new Date(value)).replace('.', '');
}

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/**
 * 'AGO/26' a partir da chave de calendário 'AAAA-MM'.
 *
 * Não passa por `Date` de propósito: a chave já é um mês de calendário, e
 * converter para Date e de volta só abriria chance de escorregar um mês na
 * virada por causa de fuso (é o tipo de bug que só aparece em produção,
 * quando o servidor não roda no mesmo fuso da máquina de quem desenvolveu).
 */
export function formatMonthKeyLabel(mesKey: string): string {
  const [ano, mes] = mesKey.split('-');
  const indice = Number(mes) - 1;
  const nome = MESES_ABREV[indice];
  if (!nome || !ano) return mesKey;
  return `${nome}/${ano.slice(2)}`;
}

/** Data-only (sem hora) tratada como calendário — usada em dataVencimento/dataCompetencia. */
export function parseCalendarDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function todayInSaoPaulo(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${parts}T00:00:00`);
}
