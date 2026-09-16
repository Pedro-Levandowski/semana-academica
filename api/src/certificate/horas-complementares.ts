export interface AtividadeExtrato {
  tipo: 'palestra' | 'minicurso';
  cargaHorariaMinutos: number;
}

interface CargasBrutas {
  palestrasMinutos: number;
  minicursosMinutos: number;
  totalMinutos: number;
}

export function somarCargasBrutas(itens: AtividadeExtrato[]): CargasBrutas {
  let palestrasMinutos = 0;
  let minicursosMinutos = 0;

  for (const item of itens) {
    if (item.tipo === 'palestra') {
      palestrasMinutos += item.cargaHorariaMinutos;
    } else {
      minicursosMinutos += item.cargaHorariaMinutos;
    }
  }

  return { palestrasMinutos, minicursosMinutos, totalMinutos: palestrasMinutos + minicursosMinutos };
}

export function calcularAproveitadoMinutos(palestrasMinutos: number, minicursosMinutos: number): number {
  const palestrasAproveitadas = Math.min(240, palestrasMinutos);
  return Math.min(1200, palestrasAproveitadas + minicursosMinutos);
}
