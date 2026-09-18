import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository, InscricaoData } from '../repositories/inscricao-repository.js';
import { Clock } from '../clock/clock.js';
import { NotFoundError } from './errors.js';
import { DomainError, getEarliestEncontroInicio } from '../domain/activity.js';
import { processExpirationsAndConvocations } from '../domain/inscricao-service.js';

export class CancelInscricaoUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private inscricaoRepository: InscricaoRepository,
    private clock: Clock
  ) {}

  execute(inscricaoId: string, participanteId: string): InscricaoData {
    let inscricao = this.inscricaoRepository.findById(inscricaoId);
    if (!inscricao) {
      throw new NotFoundError('Inscrição não encontrada');
    }

    if (inscricao.participanteId !== participanteId) {
      throw new NotFoundError('Inscrição não encontrada');
    }

    const agora = this.clock.now();
    processExpirationsAndConvocations(this.activityRepository, this.inscricaoRepository, agora, inscricao.atividadeId);

    inscricao = this.inscricaoRepository.findById(inscricaoId);
    if (!inscricao) {
      throw new NotFoundError('Inscrição não encontrada');
    }

    if (inscricao.status === 'cancelada' || inscricao.status === 'expirada') {
      throw new DomainError('INSCRICAO_INATIVA', 'Inscrição já está inativa');
    }

    const activity = this.activityRepository.findById(inscricao.atividadeId);
    if (!activity) {
      throw new NotFoundError('Atividade não encontrada');
    }

    const primeiroInicio = getEarliestEncontroInicio(activity.encontros);
    if (agora >= primeiroInicio) {
      throw new DomainError('ATIVIDADE_JA_INICIADA', 'A atividade já foi iniciada');
    }

    this.inscricaoRepository.cancelInscricao(inscricaoId);

    // Process waitlist promotion or reordering after cancellation
    processExpirationsAndConvocations(this.activityRepository, this.inscricaoRepository, agora, inscricao.atividadeId);

    const updated = this.inscricaoRepository.findById(inscricaoId);
    if (!updated) {
      throw new NotFoundError('Inscrição não encontrada');
    }

    return updated;
  }
}
