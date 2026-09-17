import { ActivityRepository } from '../repositories/activity-repository.js';
import { Clock } from '../clock/clock.js';
import { DomainError } from '../domain/activity.js';
import { NotFoundError } from './errors.js';
import { DateTime } from 'luxon';
import crypto from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export interface CodigoDoEncontroResult {
  encontroId: string;
  codigo: string;
  trocaEm: string;
  validoAte: string;
}

export class GetCodigoDoEncontroUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private clock: Clock
  ) {}

  execute(encontroId: string): CodigoDoEncontroResult {
    const result = this.activityRepository.findEncounterWithActivity(encontroId);
    if (!result) {
      throw new NotFoundError('Encontro não encontrado');
    }

    const { encounter, activity } = result;

    if (activity.cancelada) {
      throw new DomainError('ATIVIDADE_CANCELADA', 'Atividade cancelada');
    }

    const agora = this.clock.now();
    const inicio = DateTime.fromISO(encounter.inicio, { setZone: true });
    const janelaInicio = inicio.minus({ minutes: 15 });
    const janelaFim = inicio.plus({ minutes: 30 });

    if (agora < janelaInicio || agora > janelaFim) {
      throw new DomainError('FORA_DA_JANELA', 'Fora da janela de obtenção do código');
    }

    const minuteBucket = agora.toFormat('yyyy-MM-dd\'T\'HH:mm');
    const hash = crypto.createHash('sha256').update(`${encontroId}-${minuteBucket}`).digest();
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      const byte = hash[i];
      codigo += ALPHABET[byte % ALPHABET.length];
    }

    const trocaEm = agora.startOf('minute').plus({ minutes: 1 }).toISO()!;
    const validoAte = agora.startOf('minute').plus({ minutes: 2 }).toISO()!;

    return {
      encontroId,
      codigo,
      trocaEm,
      validoAte
    };
  }
}
