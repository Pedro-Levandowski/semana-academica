import { InscricaoRepository } from '../repositories/inscricao-repository.js';
import { UserRepository } from '../repositories/user-repository.js';

export interface M2PainelInscricao {
  atividadeId: string;
  participanteId: string;
  nome: string;
  status: 'confirmada' | 'em_espera' | 'convocada' | 'cancelada' | 'expirada';
}

export interface M2PainelSourcePort {
  listarInscricoesParaPainel(): M2PainelInscricao[];
}

export class SQLiteM2PainelSourceAdapter implements M2PainelSourcePort {
  constructor(
    private inscricaoRepository: InscricaoRepository,
    private userRepository: UserRepository
  ) {}

  listarInscricoesParaPainel(): M2PainelInscricao[] {
    return this.inscricaoRepository.findAll().map(inscricao => ({
      atividadeId: inscricao.atividadeId,
      participanteId: inscricao.participanteId,
      nome: this.userRepository.findById(inscricao.participanteId)?.nome || '',
      status: inscricao.status
    }));
  }
}
