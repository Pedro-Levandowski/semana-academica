import { ActivityRepository } from '../repositories/activity-repository.js';

export interface M1PainelEncontro {
  id: string;
  inicio: string;
  fim: string;
}

export interface M1PainelAtividade {
  id: string;
  titulo: string;
  vagas: number;
  cancelada: boolean;
  encontros: M1PainelEncontro[];
}

export interface M1PainelSourcePort {
  listarAtividadesParaPainel(): M1PainelAtividade[];
}

export class SQLiteM1PainelSourceAdapter implements M1PainelSourcePort {
  constructor(private activityRepository: ActivityRepository) {}

  listarAtividadesParaPainel(): M1PainelAtividade[] {
    return this.activityRepository.findAll().map(atividade => ({
      id: atividade.id,
      titulo: atividade.titulo,
      vagas: atividade.vagas,
      cancelada: atividade.cancelada === 1,
      encontros: atividade.encontros.map(encontro => ({
        id: encontro.id,
        inicio: encontro.inicio,
        fim: encontro.fim
      }))
    }));
  }
}
