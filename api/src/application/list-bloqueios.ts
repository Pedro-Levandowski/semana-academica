import { PainelQueryPort } from '../integrations/painel-query-port.js';
import { Clock } from '../clock/clock.js';
import { DateTime } from 'luxon';

export interface BloqueioItemOutput {
  participanteId: string;
  nome: string;
  atividades: string[];
  bloqueadoDesde: string;
}

interface EligibleActivity {
  atividadeId: string;
  fim: DateTime;
}

interface ParticipantData {
  participanteId: string;
  nome: string;
  activities: EligibleActivity[];
}

export class ListBloqueiosUseCase {
  constructor(private painelQueryPort: PainelQueryPort, private clock: Clock) {}

  execute(): BloqueioItemOutput[] {
    const atividades = this.painelQueryPort.listarAtividades();
    const agora = this.clock.now();

    const participantMap = new Map<string, ParticipantData>();

    for (const atv of atividades) {
      if (atv.cancelada) {
        continue;
      }
      if (!atv.encontros || atv.encontros.length === 0) {
        continue;
      }

      let maxFim: DateTime | null = null;
      for (const enc of atv.encontros) {
        if (!enc.fim) continue;
        const dt = DateTime.fromISO(enc.fim, { setZone: true });
        if (!dt.isValid) continue;
        if (!maxFim || dt > maxFim) {
          maxFim = dt;
        }
      }

      if (!maxFim || maxFim > agora) {
        continue;
      }

      for (const ins of atv.inscricoes) {
        if (ins.status !== 'confirmada') {
          continue;
        }

        let hasPresence = false;
        for (const enc of atv.encontros) {
          const presencas = enc.presencas || [];
          if (presencas.some(p => p.participanteId === ins.participanteId)) {
            hasPresence = true;
            break;
          }
        }

        if (hasPresence) {
          continue;
        }

        let pData = participantMap.get(ins.participanteId);
        if (!pData) {
          pData = {
            participanteId: ins.participanteId,
            nome: ins.nome || '',
            activities: []
          };
          participantMap.set(ins.participanteId, pData);
        }

        pData.activities.push({
          atividadeId: atv.id,
          fim: maxFim
        });
      }
    }

    const result: BloqueioItemOutput[] = [];

    for (const pData of participantMap.values()) {
      if (pData.activities.length < 2) {
        continue;
      }

      pData.activities.sort((a, b) => {
        const diff = a.fim.toMillis() - b.fim.toMillis();
        if (diff !== 0) {
          return diff;
        }
        return a.atividadeId.localeCompare(b.atividadeId);
      });

      const firstTwo = pData.activities.slice(0, 2);
      const bloqueadoDesdeIso = firstTwo[1].fim.toISO();
      if (!bloqueadoDesdeIso) {
        continue;
      }

      result.push({
        participanteId: pData.participanteId,
        nome: pData.nome,
        atividades: firstTwo.map(e => e.atividadeId),
        bloqueadoDesde: bloqueadoDesdeIso
      });
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
