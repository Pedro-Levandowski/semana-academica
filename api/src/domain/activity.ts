import { DateTime } from 'luxon';

export class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export interface ActivityData {
  id: string;
  titulo: string;
  tipo: string;
  salaId: string;
  vagas: number;
  cargaHorariaMinutos: number;
  cancelada: number;
  encontros: Array<{ id: string; inicio: string; fim: string }>;
}

export function validateActivityEncounterCount(tipo: string, encontrosCount: number): void {
  if (tipo === 'palestra' && encontrosCount !== 1) {
    throw new DomainError('QUANTIDADE_DE_ENCONTROS', 'Palestra deve ter exatamente 1 encontro');
  }
  if (tipo === 'minicurso' && (encontrosCount < 2 || encontrosCount > 5)) {
    throw new DomainError('QUANTIDADE_DE_ENCONTROS', 'Minicurso deve ter entre 2 e 5 encontros');
  }
}

export interface ParsedEncounter {
  inicio: DateTime;
  fim: DateTime;
}

export function parseAndValidateEncounter(enc: { inicio: string; fim: string }): ParsedEncounter {
  if (typeof enc.inicio !== 'string' || typeof enc.fim !== 'string') {
    throw new DomainError('ENCONTRO_INVALIDO', 'Início e fim devem ser strings');
  }

  const hasOffset = /Z|[+-]\d{2}:?\d{2}$/i.test(enc.inicio) && /Z|[+-]\d{2}:?\d{2}$/i.test(enc.fim);
  if (!hasOffset) {
    throw new DomainError('ENCONTRO_INVALIDO', 'Data deve incluir Z ou offset explícito');
  }

  const inicioDt = DateTime.fromISO(enc.inicio, { setZone: true });
  const fimDt = DateTime.fromISO(enc.fim, { setZone: true });

  if (!inicioDt.isValid || !fimDt.isValid) {
    throw new DomainError('ENCONTRO_INVALIDO', 'Data ISO inválida');
  }

  const duracaoMinutos = fimDt.diff(inicioDt, 'minutes').minutes;
  if (duracaoMinutos < 60 || duracaoMinutos > 240) {
    throw new DomainError('ENCONTRO_INVALIDO', 'Duração do encontro deve ser entre 60 e 240 minutos');
  }

  const inicioLocal = inicioDt.setZone('America/Sao_Paulo');
  const fimLocal = fimDt.setZone('America/Sao_Paulo');

  const inicioDate = inicioLocal.toISODate();
  const fimDate = fimLocal.toISODate();

  const minDate = '2026-10-19';
  const maxDate = '2026-10-23';

  if (!inicioDate || !fimDate || inicioDate < minDate || inicioDate > maxDate || fimDate < minDate || fimDate > maxDate) {
    throw new DomainError('ENCONTRO_INVALIDO', 'Encontro fora do período do evento (19/10 a 23/10/2026)');
  }

  if (inicioDate !== fimDate) {
    throw new DomainError('ENCONTRO_INVALIDO', 'Encontro não pode atravessar a meia-noite');
  }

  return { inicio: inicioDt, fim: fimDt };
}

export function validateEncounterRules(encontros: Array<{ inicio: string; fim: string }>): void {
  const parsed = encontros.map(parseAndValidateEncounter);

  const sorted = [...parsed].sort((a, b) => a.inicio.toMillis() - b.inicio.toMillis());
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (next.inicio < current.fim) {
      throw new DomainError('ENCONTRO_INVALIDO', 'Sobreposição entre encontros da mesma atividade');
    }
  }
}

export function calculateCargaHoraria(encontros: Array<{ inicio: string; fim: string }>): number {
  let total = 0;
  for (const enc of encontros) {
    const inicioDt = DateTime.fromISO(enc.inicio, { setZone: true });
    const fimDt = DateTime.fromISO(enc.fim, { setZone: true });
    const duracaoMinutos = fimDt.diff(inicioDt, 'minutes').minutes;
    total += Math.round(duracaoMinutos);
  }
  return total;
}
