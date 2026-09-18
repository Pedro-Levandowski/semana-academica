import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository } from '../repositories/inscricao-repository.js';
import { PresencaRepository, PresencaRow } from '../repositories/presenca-repository.js';
import { Clock } from '../clock/clock.js';
import { DomainError } from '../domain/activity.js';
import { NotFoundError } from './errors.js';
import { DateTime } from 'luxon';
import crypto from 'crypto';

export class RegisterPresencaManualUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private inscricaoRepository: InscricaoRepository,
    private presencaRepository: PresencaRepository,
    private clock: Clock
  ) {}

  execute(encontroId: string, participanteId: string, input: { participanteId?: string; justificativa?: string }): { presenca: PresencaRow; statusCode: number } {
    const result = this.activityRepository.findEncounterWithActivity(encontroId);
    if (!result) {
      throw new NotFoundError('Encontro não encontrado');
    }

    const justificativa = input.justificativa;
    if (!justificativa || typeof justificativa !== 'string' || justificativa.trim().length < 10) {
      throw new DomainError('JUSTIFICATIVA_OBRIGATORIA', 'Justificativa obrigatória com no mínimo 10 caracteres');
    }

    const existing = this.presencaRepository.findByEncontroAndParticipante(encontroId, participanteId);
    if (existing) {
      return { presenca: existing, statusCode: 200 };
    }

    const statusInscricao = this.inscricaoRepository.findStatus(result.activity.id, participanteId);
    if (statusInscricao !== 'confirmada') {
      throw new DomainError('NAO_INSCRITO', 'Participante sem inscrição confirmada');
    }

    const agora = this.clock.now();
    const inicio = DateTime.fromISO(result.encounter.inicio, { setZone: true });
    const fim = DateTime.fromISO(result.encounter.fim, { setZone: true });
    const janelaInicio = inicio.minus({ minutes: 15 });
    const limiteFim = fim.plus({ hours: 2 });

    if (agora < janelaInicio || agora > limiteFim) {
      throw new DomainError('FORA_DA_JANELA', 'Fora da janela de presença manual');
    }

    const confirmados = this.inscricaoRepository.countConfirmed(result.activity.id);
    const limiteManuais = Math.ceil(confirmados * 0.1);
    const manuaisAtuais = this.presencaRepository.countManualByEncontro(encontroId);
    if (manuaisAtuais >= limiteManuais) {
      throw new DomainError('LIMITE_DE_MANUAIS', 'Limite de presenças manuais atingido');
    }

    const id = 'pre_' + crypto.randomBytes(4).toString('hex');
    const presenca: PresencaRow = {
      id,
      encontroId,
      participanteId,
      origem: 'manual',
      lidoEm: agora.toISO()!,
      registradaEm: agora.toISO()!,
      justificativa
    };

    this.presencaRepository.create(presenca);

    return { presenca, statusCode: 201 };
  }
}
