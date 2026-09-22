import { PresencaRepository } from '../repositories/presenca-repository.js';

export type M3PainelOrigemPresenca = 'qr' | 'qr_offline' | 'manual';

export interface M3PainelPresenca {
  participanteId: string;
  origem: M3PainelOrigemPresenca;
}

export interface M3PainelSourcePort {
  listarPresencasDoEncontroParaPainel(encontroId: string): M3PainelPresenca[];
}

export class SQLiteM3PainelSourceAdapter implements M3PainelSourcePort {
  constructor(private presencaRepository: PresencaRepository) {}

  listarPresencasDoEncontroParaPainel(encontroId: string): M3PainelPresenca[] {
    return this.presencaRepository.findByEncontro(encontroId).map(presenca => ({
      participanteId: presenca.participanteId,
      origem: presenca.origem as M3PainelOrigemPresenca
    }));
  }
}
