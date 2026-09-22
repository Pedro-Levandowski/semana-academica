import { PainelQueryPort } from '../integrations/painel-query-port.js';
import { Clock } from '../clock/clock.js';
import { DateTime } from 'luxon';
import { NotFoundError } from './errors.js';

export interface SemChanceItemOutput {
  participanteId: string;
  nome: string;
  faltas: number;
  faltasPermitidas: number;
}

export class ListSemChanceUseCase {
  constructor(private painelQueryPort: PainelQueryPort, private clock: Clock) {}

  execute(atividadeId: string): SemChanceItemOutput[] {
    const atividades = this.painelQueryPort.listarAtividades();
    const atividade = atividades.find(a => a.id === atividadeId);
    if (!atividade) {
      throw new NotFoundError('Atividade não encontrada');
    }

    if (atividade.cancelada) {
      return [];
    }

    const agora = this.clock.now();
    const N = atividade.encontros.length;
    const faltasPermitidas = N - Math.ceil(0.75 * N);

    const confirmados = atividade.inscricoes.filter(i => i.status === 'confirmada');
    const result: SemChanceItemOutput[] = [];

    for (const conf of confirmados) {
      let faltas = 0;
      for (const enc of atividade.encontros) {
        if (!enc.fim) continue;
        const fimDt = DateTime.fromISO(enc.fim, { setZone: true });
        const limiteJanela = fimDt.plus({ hours: 2 });
        if (agora > limiteJanela) {
          const presencasEnc = enc.presencas || [];
          const presente = presencasEnc.some(p => p.participanteId === conf.participanteId);
          if (!presente) {
            faltas++;
          }
        }
      }

      if (faltas > faltasPermitidas) {
        result.push({
          participanteId: conf.participanteId,
          nome: conf.nome || '',
          faltas,
          faltasPermitidas
        });
      }
    }

    result.sort((a, b) => {
      const compNome = a.nome.localeCompare(b.nome);
      if (compNome !== 0) {
        return compNome;
      }
      return a.participanteId.localeCompare(b.participanteId);
    });

    return result;
  }
}
