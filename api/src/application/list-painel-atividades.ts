import { PainelQueryPort } from '../integrations/painel-query-port.js';
import { DateTime } from 'luxon';

export interface PainelAtividadeItemOutput {
  atividadeId: string;
  titulo: string;
  vagas: number;
  ocupadas: number;
  emEspera: number;
  ocupacaoPercentual: number;
  frequenciaPercentual: null;
}

export class ListPainelAtividadesUseCase {
  constructor(private painelQueryPort: PainelQueryPort) {}

  private getEarliestStartMillis(encontros: Array<{ inicio: string }>): number {
    if (!encontros || encontros.length === 0) {
      return Number.MAX_SAFE_INTEGER;
    }
    let minMillis = Number.MAX_SAFE_INTEGER;
    for (const enc of encontros) {
      const dt = DateTime.fromISO(enc.inicio, { setZone: true });
      const millis = dt.toMillis();
      if (!isNaN(millis) && millis < minMillis) {
        minMillis = millis;
      }
    }
    return minMillis === Number.MAX_SAFE_INTEGER ? 0 : minMillis;
  }

  execute(): PainelAtividadeItemOutput[] {
    const atividades = this.painelQueryPort.listarAtividades();

    const naoCanceladas = atividades.filter(a => !a.cancelada);

    naoCanceladas.sort((a, b) => {
      const timeA = this.getEarliestStartMillis(a.encontros);
      const timeB = this.getEarliestStartMillis(b.encontros);
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      const compTitulo = a.titulo.localeCompare(b.titulo);
      if (compTitulo !== 0) {
        return compTitulo;
      }
      return a.id.localeCompare(b.id);
    });

    return naoCanceladas.map(a => {
      let ocupadas = 0;
      let emEspera = 0;

      for (const ins of a.inscricoes) {
        if (ins.status === 'confirmada' || ins.status === 'convocada') {
          ocupadas++;
        } else if (ins.status === 'em_espera') {
          emEspera++;
        }
      }

      const ocupacaoPercentual = a.vagas > 0
        ? Math.round(((ocupadas / a.vagas) * 100) * 10) / 10
        : 0;

      return {
        atividadeId: a.id,
        titulo: a.titulo,
        vagas: a.vagas,
        ocupadas,
        emEspera,
        ocupacaoPercentual,
        frequenciaPercentual: null
      };
    });
  }
}
