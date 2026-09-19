import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository } from '../repositories/inscricao-repository.js';
import { PresencaRepository } from '../repositories/presenca-repository.js';
import { UserRepository } from '../repositories/user-repository.js';

export interface PainelPresencaPortrait {
  participanteId: string;
}

export interface PainelEncontroPortrait {
  id: string;
  inicio: string;
  fim: string;
  presencas?: PainelPresencaPortrait[];
}

export interface PainelInscricaoPortrait {
  participanteId: string;
  nome?: string;
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
    private inscricaoRepository: InscricaoRepository,
    private presencaRepository: PresencaRepository,
    private userRepository: UserRepository
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
      const user = this.userRepository.findById(ins.participanteId);
      list.push({
        participanteId: ins.participanteId,
        nome: user?.nome || '',
        status: ins.status
      });
    }

    return activities.map(act => ({
      id: act.id,
      titulo: act.titulo,
      vagas: act.vagas,
      cancelada: act.cancelada === 1,
      encontros: act.encontros.map(e => {
        const presencasRows = this.presencaRepository.findByEncontro(e.id);
        const presencasPortraits: PainelPresencaPortrait[] = presencasRows.map(p => ({
          participanteId: p.participanteId
        }));
        return {
          id: e.id,
          inicio: e.inicio,
          fim: e.fim,
          presencas: presencasPortraits
        };
      }),
      inscricoes: inscricoesByActivity.get(act.id) || []
    }));
  }
}
