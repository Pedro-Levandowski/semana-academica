import type { M1PainelSourcePort } from './m1-painel-source-port.js';
import type { M2PainelSourcePort } from './m2-painel-source-port.js';
import type { M3PainelOrigemPresenca, M3PainelSourcePort } from './m3-painel-source-port.js';

export interface PainelPresencaPortrait {
  participanteId: string;
  origem: M3PainelOrigemPresenca;
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
    private m1PainelSourcePort: M1PainelSourcePort,
    private m2PainelSourcePort: M2PainelSourcePort,
    private m3PainelSourcePort: M3PainelSourcePort
  ) {}

  listarAtividades(): PainelAtividadePortrait[] {
    const activities = this.m1PainelSourcePort.listarAtividadesParaPainel();
    const allInscricoes = this.m2PainelSourcePort.listarInscricoesParaPainel();

    const inscricoesByActivity = new Map<string, PainelInscricaoPortrait[]>();
    for (const ins of allInscricoes) {
      let list = inscricoesByActivity.get(ins.atividadeId);
      if (!list) {
        list = [];
        inscricoesByActivity.set(ins.atividadeId, list);
      }
      list.push({
        participanteId: ins.participanteId,
        nome: ins.nome,
        status: ins.status
      });
    }

    return activities.map(act => ({
      id: act.id,
      titulo: act.titulo,
      vagas: act.vagas,
      cancelada: act.cancelada,
      encontros: act.encontros.map(e => {
        const presencasPortraits: PainelPresencaPortrait[] =
          this.m3PainelSourcePort.listarPresencasDoEncontroParaPainel(e.id);
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
