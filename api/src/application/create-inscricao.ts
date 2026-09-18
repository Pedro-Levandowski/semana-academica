import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository, InscricaoData } from '../repositories/inscricao-repository.js';
import { Clock } from '../clock/clock.js';
import { M5IntegrationPort, NeutralM5Adapter } from '../integrations/m5-port.js';
import { NotFoundError } from './errors.js';
import { DomainError, ConflictError, sortEncontros } from '../domain/activity.js';
import { processExpirationsAndConvocations } from '../domain/inscricao-service.js';

function hasEncounterOverlap(
  encs1: Array<{ inicio: string; fim: string }>,
  encs2: Array<{ inicio: string; fim: string }>
): boolean {
  for (const e1 of encs1) {
    const start1 = DateTime.fromISO(e1.inicio, { setZone: true });
    const end1 = DateTime.fromISO(e1.fim, { setZone: true });
    for (const e2 of encs2) {
      const start2 = DateTime.fromISO(e2.inicio, { setZone: true });
      const end2 = DateTime.fromISO(e2.fim, { setZone: true });

      if (start1 < end2 && end1 > start2) {
        return true;
      }
    }
  }
  return false;
}

export class CreateInscricaoUseCase {
  private m5Port: M5IntegrationPort;

  constructor(
    private activityRepository: ActivityRepository,
    private inscricaoRepository: InscricaoRepository,
    private clock: Clock,
    m5Port?: M5IntegrationPort
  ) {
    this.m5Port = m5Port || new NeutralM5Adapter();
  }

  execute(atividadeId: string, participanteId: string): InscricaoData {
    const activity = this.activityRepository.findById(atividadeId);
    if (!activity) {
      throw new NotFoundError('Atividade não encontrada');
    }

    if (activity.cancelada === 1) {
      throw new DomainError('ATIVIDADE_CANCELADA', 'Atividade cancelada');
    }

    const agora = this.clock.now();
    const sortedEncontros = sortEncontros(activity.encontros);
    const primeiroInicio = DateTime.fromISO(sortedEncontros[0].inicio, { setZone: true });
    const limiteEncerramento = primeiroInicio.minus({ minutes: 30 });

    if (agora >= limiteEncerramento) {
      throw new DomainError('INSCRICOES_ENCERRADAS', 'Inscrições encerradas para esta atividade');
    }

    processExpirationsAndConvocations(this.activityRepository, this.inscricaoRepository, agora, atividadeId);

    // Check bloqueio por faltas via porta de integração com M5 (R4)
    if (this.m5Port.isParticipantBlocked(participanteId, agora)) {
      throw new DomainError('INSCRICAO_BLOQUEADA', 'Participante possui 2 ou mais atividades encerradas com zero presença');
    }

    const existing = this.inscricaoRepository.findByActivityAndParticipant(atividadeId, participanteId);
    if (existing && ['confirmada', 'em_espera', 'convocada'].includes(existing.status)) {
      throw new DomainError('JA_INSCRITO', 'Participante já possui inscrição ativa nesta atividade');
    }

    const occupiedCount = this.inscricaoRepository.countOccupied(atividadeId);
    let status: 'confirmada' | 'em_espera' = 'confirmada';
    let posicaoNaEspera: number | null = null;

    if (occupiedCount >= activity.vagas) {
      status = 'em_espera';
      const waitlistCount = this.inscricaoRepository.countInWaitlist(atividadeId);
      posicaoNaEspera = waitlistCount + 1;
    } else {
      // Inscrição ocupará vaga -> Valida Conflito de Horários (R6) e Limite de Minicursos (R5)
      const occupiedEncounters = this.inscricaoRepository.getOccupiedEncountersForParticipant(participanteId);
      if (hasEncounterOverlap(activity.encontros, occupiedEncounters)) {
        throw new ConflictError('CONFLITO_DE_HORARIO', 'Conflito de horário com outra atividade na qual o participante ocupa vaga');
      }

      if (activity.tipo === 'minicurso') {
        const occupiedMinicursos = this.inscricaoRepository.countOccupiedMinicursos(participanteId);
        if (occupiedMinicursos >= 3) {
          throw new DomainError('LIMITE_DE_MINICURSOS', 'Participante já ocupa vaga em 3 minicursos');
        }
      }
    }

    const id = 'ins_' + crypto.randomBytes(4).toString('hex');
    const inscricao: InscricaoData = {
      id,
      atividadeId,
      participanteId,
      status,
      posicaoNaEspera,
      convocadaAte: null,
      criadaEm: agora.toISO() || new Date().toISOString()
    };

    this.inscricaoRepository.create(inscricao);
    return inscricao;
  }
}
