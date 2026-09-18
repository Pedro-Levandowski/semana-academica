import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository, InscricaoData } from '../repositories/inscricao-repository.js';
import { Clock } from '../clock/clock.js';
import { NotFoundError } from './errors.js';
import { DomainError, sortEncontros } from '../domain/activity.js';

export class CreateInscricaoUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private inscricaoRepository: InscricaoRepository,
    private clock: Clock
  ) {}

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
