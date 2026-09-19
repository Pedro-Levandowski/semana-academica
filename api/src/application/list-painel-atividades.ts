import { PainelQueryPort } from '../integrations/painel-query-port.js';
import { Clock } from '../clock/clock.js';
import { DateTime } from 'luxon';

export interface PainelAtividadeItemOutput {
  atividadeId: string;
  titulo: string;
  vagas: number;
  ocupadas: number;
  emEspera: number;
  ocupacaoPercentual: number;
  frequenciaPercentual: number | null;
}

export class ListPainelAtividadesUseCase {
  constructor(private painelQueryPort: PainelQueryPort, private clock: Clock) {}

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
    const agora = this.clock.now();

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

      let frequenciaPercentual: number | null = null;
      const confirmados = new Set(
        a.inscricoes
          .filter(i => i.status === 'confirmada')
          .map(i => i.participanteId)
      );

      if (confirmados.size > 0) {
        const frequenciasBrutas: number[] = [];
        for (const enc of a.encontros) {
          if (!enc.fim) continue;
          const fimDt = DateTime.fromISO(enc.fim, { setZone: true });
          if (fimDt <= agora) {
            const presencasEnc = enc.presencas || [];
            const presencasConfirmadas = new Set(
              presencasEnc
                .filter(p => confirmados.has(p.participanteId))
                .map(p => p.participanteId)
            );
            const freqBruta = (presencasConfirmadas.size / confirmados.size) * 100;
            frequenciasBrutas.push(freqBruta);
          }
        }

        if (frequenciasBrutas.length > 0) {
          const soma = frequenciasBrutas.reduce((acc, curr) => acc + curr, 0);
          const media = soma / frequenciasBrutas.length;
          frequenciaPercentual = Math.round(media * 10) / 10;
        }
      }

      return {
        atividadeId: a.id,
        titulo: a.titulo,
        vagas: a.vagas,
        ocupadas,
        emEspera,
        ocupacaoPercentual,
        frequenciaPercentual
      };
    });
  }
}
