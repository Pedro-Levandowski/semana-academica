import crypto from 'node:crypto';
import { RoomRepository } from '../repositories/room-repository.js';
import { ActivityRepository } from '../repositories/activity-repository.js';
import {
  validateActivityEncounterCount,
  validateEncounterRules,
  validateVagas,
  validateRoomConflict,
  calculateCargaHoraria,
  ActivityData
} from '../domain/activity.js';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class CreateActivityUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private roomRepository: RoomRepository
  ) {}

  execute(input: {
    titulo: string;
    tipo: string;
    salaId: string;
    vagas: number;
    encontros: Array<{ inicio: string; fim: string }>;
  }): ActivityData {
    const room = this.roomRepository.findById(input.salaId);
    if (!room) {
      throw new NotFoundError('Sala não encontrada');
    }

    validateActivityEncounterCount(input.tipo, input.encontros.length);
    validateVagas(input.vagas, room.capacidade);
    validateEncounterRules(input.encontros);

    const existingEncounters = this.activityRepository.findActiveEncountersByRoomId(input.salaId);
    validateRoomConflict(input.encontros, existingEncounters);

    const atvId = 'atv_' + crypto.randomBytes(4).toString('hex');
    const encontrosWithIds = input.encontros.map(enc => ({
      id: 'enc_' + crypto.randomBytes(4).toString('hex'),
      inicio: enc.inicio,
      fim: enc.fim
    }));

    const cargaHorariaMinutos = calculateCargaHoraria(input.encontros);

    this.activityRepository.create({
      id: atvId,
      titulo: input.titulo,
      tipo: input.tipo,
      salaId: input.salaId,
      vagas: input.vagas,
      cargaHorariaMinutos,
      encontros: encontrosWithIds
    });

    const created: ActivityData = {
      id: atvId,
      titulo: input.titulo,
      tipo: input.tipo,
      salaId: input.salaId,
      vagas: input.vagas,
      cargaHorariaMinutos,
      cancelada: 0,
      encontros: encontrosWithIds
    };

    return created;
  }
}
