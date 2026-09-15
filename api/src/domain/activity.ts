export class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export function validateActivityEncounterCount(tipo: string, encontrosCount: number): void {
  if (tipo === 'palestra' && encontrosCount !== 1) {
    throw new DomainError('QUANTIDADE_DE_ENCONTROS', 'Palestra deve ter exatamente 1 encontro');
  }
  if (tipo === 'minicurso' && (encontrosCount < 2 || encontrosCount > 5)) {
    throw new DomainError('QUANTIDADE_DE_ENCONTROS', 'Minicurso deve ter entre 2 e 5 encontros');
  }
}

export function calculateCargaHoraria(encontros: Array<{ inicio: string; fim: string }>): number {
  let total = 0;
  for (const enc of encontros) {
    const duracaoMs = new Date(enc.fim).getTime() - new Date(enc.inicio).getTime();
    total += Math.round(duracaoMs / 60000);
  }
  return total;
}
