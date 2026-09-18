import { DateTime } from 'luxon';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository, InscricaoData } from '../repositories/inscricao-repository.js';
import { Clock } from '../clock/clock.js';
import { NotFoundError } from './errors.js';
import { DomainError, ConflictError } from '../domain/activity.js';
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

export class ConfirmInscricaoUseCase {
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

    if (inscricao.status === 'expirada') {
      throw new DomainError('CONVOCACAO_EXPIRADA', 'A convocação para esta inscrição já expirou');
    }

    if (inscricao.status !== 'convocada') {
      throw new DomainError('SEM_CONVOCACAO', 'A inscrição não está em estado de convocação');
    }

    if (inscricao.convocadaAte) {
      const convocadaAteDt = DateTime.fromISO(inscricao.convocadaAte, { setZone: true });
      if (agora > convocadaAteDt) {
        throw new DomainError('CONVOCACAO_EXPIRADA', 'A convocação para esta inscrição já expirou');
      }
    }

    const activity = this.activityRepository.findById(inscricao.atividadeId);
    if (!activity) {
      throw new NotFoundError('Atividade não encontrada');
    }

    // Revalidação do Limite de Minicursos (R5, R14)
    if (activity.tipo === 'minicurso') {
      const countMinicursos = this.inscricaoRepository.countOccupiedMinicursos(participanteId);
      if (countMinicursos > 3) {
        throw new DomainError('LIMITE_DE_MINICURSOS', 'Participante excede o limite de 3 minicursos');
      }
    }

    // Revalidação de Conflito de Horários (R6, R14)
    // Busca encontros ocupados pelo participante em OUTRAS atividades (excluindo a atividade atual)
    const otherOccupiedEncounters = this.inscricaoRepository
      .getOccupiedEncountersForParticipant(participanteId)
      .filter(e => e.atividadeId !== inscricao.atividadeId);

    if (hasEncounterOverlap(activity.encontros, otherOccupiedEncounters)) {
      throw new ConflictError('CONFLITO_DE_HORARIO', 'Conflito de horário com outra atividade na qual o participante ocupa vaga');
    }

    // Se todas as validações passaram -> confirma
    this.inscricaoRepository.confirmInscricao(inscricaoId);

    const updated = this.inscricaoRepository.findById(inscricaoId);
    if (!updated) {
      throw new NotFoundError('Inscrição não encontrada');
    }

    return updated;
  }
}
