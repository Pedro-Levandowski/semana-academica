import crypto from 'node:crypto';
import { RoomRepository } from '../repositories/room-repository.js';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { M2IntegrationPort } from '../integrations/m2-port.js';
import { validateActivityEncounterCount, calculateCargaHoraria } from '../domain/activity.js';
import { mapActivityResponse } from '../http/activity-response.js';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class CreateActivityUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private roomRepository: RoomRepository,
    private m2Port: M2IntegrationPort
  ) {}

  execute(input: {
    titulo: string;
    tipo: string;
    salaId: string;
    vagas: number;
    encontros: Array<{ inicio: string; fim: string }>;
  }) {
    const room = this.roomRepository.findById(input.salaId);
    if (!room) {
      throw new NotFoundError('Sala não encontrada');
    }

    validateActivityEncounterCount(input.tipo, input.encontros.length);

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

    const created = {
      id: atvId,
      titulo: input.titulo,
      tipo: input.tipo,
      salaId: input.salaId,
      vagas: input.vagas,
      cargaHorariaMinutos,
      cancelada: 0,
      encontros: encontrosWithIds
    };

    return mapActivityResponse(created, this.m2Port);
  }
}
