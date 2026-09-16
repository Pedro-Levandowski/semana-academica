import { ActivityRepository } from '../repositories/activity-repository.js';
import { RoomRepository } from '../repositories/room-repository.js';
import { M2IntegrationPort } from '../integrations/m2-port.js';
import { ActivityData, DomainError, ConflictError, validateVagas } from '../domain/activity.js';
import { NotFoundError } from './errors.js';

export class UpdateActivityUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private roomRepository: RoomRepository,
    private m2Port: M2IntegrationPort
  ) {}

  execute(id: string, input: {
    titulo?: string;
    vagas?: number;
    tipo?: any;
    salaId?: any;
    encontros?: any;
    cargaHorariaMinutos?: any;
  }): ActivityData {
    const activity = this.activityRepository.findById(id);
    if (!activity) {
      throw new NotFoundError('Atividade não encontrada');
    }

    if (activity.cancelada) {
      throw new DomainError('ATIVIDADE_CANCELADA', 'Atividade está cancelada');
    }

    if (input.tipo !== undefined) {
      throw new DomainError('CAMPO_NAO_EDITAVEL', 'O campo tipo não é editável');
    }
    if (input.salaId !== undefined) {
      throw new DomainError('CAMPO_NAO_EDITAVEL', 'O campo salaId não é editável');
    }
    if (input.encontros !== undefined) {
      throw new DomainError('CAMPO_NAO_EDITAVEL', 'O campo encontros não é editável');
    }

    let shouldConvocar = false;

    if (input.vagas !== undefined) {
      const room = this.roomRepository.findById(activity.salaId);
      if (!room) {
        throw new NotFoundError('Sala não encontrada');
      }
      validateVagas(input.vagas, room.capacidade);

      const ocupadas = this.m2Port.getOcupadas(activity.id);
      if (input.vagas < ocupadas) {
        throw new ConflictError('VAGAS_ABAIXO_DOS_INSCRITOS', 'Número de vagas abaixo da quantidade de inscritos');
      }

      if (input.vagas > activity.vagas && input.vagas > ocupadas) {
        shouldConvocar = true;
      }
    }

    const updateFields: { titulo?: string; vagas?: number } = {};
    if (input.titulo !== undefined) {
      updateFields.titulo = input.titulo;
    }
    if (input.vagas !== undefined) {
      updateFields.vagas = input.vagas;
    }

    this.activityRepository.update(id, updateFields);

    if (shouldConvocar) {
      this.m2Port.convocarEspera(id);
    }

    const updated = this.activityRepository.findById(id);
    if (!updated) {
      throw new NotFoundError('Atividade não encontrada');
    }

    return updated;
  }
}
