import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository } from '../repositories/inscricao-repository.js';

export interface PainelEncontroPortrait {
  id: string;
  inicio: string;
  fim: string;
}

export interface PainelInscricaoPortrait {
  participanteId: string;
  status: 'confirmada' | 'em_espera' | 'convocada' | 'cancelada' | 'expirada';
}

export interface PainelAtividadePortrait {
  id: string;
  titulo: string;
  vagas: number;
  cancelada: boolean;
  encontros: PainelEncontroPortrait[];
  inscricoes: PainelInscricaoPortrait[];
}

export interface PainelQueryPort {
  listarAtividades(): PainelAtividadePortrait[];
}

export class SQLitePainelQueryAdapter implements PainelQueryPort {
  constructor(
    private activityRepository: ActivityRepository,
    private inscricaoRepository: InscricaoRepository
  ) {}

  listarAtividades(): PainelAtividadePortrait[] {
    const activities = this.activityRepository.findAll();
    const allInscricoes = this.inscricaoRepository.findAll();

    const inscricoesByActivity = new Map<string, PainelInscricaoPortrait[]>();
    for (const ins of allInscricoes) {
      let list = inscricoesByActivity.get(ins.atividadeId);
      if (!list) {
        list = [];
        inscricoesByActivity.set(ins.atividadeId, list);
      }
      list.push({
        participanteId: ins.participanteId,
        status: ins.status
      });
    }

    return activities.map(act => ({
      id: act.id,
      titulo: act.titulo,
      vagas: act.vagas,
      cancelada: act.cancelada === 1,
      encontros: act.encontros.map(e => ({
        id: e.id,
        inicio: e.inicio,
        fim: e.fim
      })),
      inscricoes: inscricoesByActivity.get(act.id) || []
    }));
  }
}
