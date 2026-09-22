import { ListBloqueiosUseCase } from './list-bloqueios.js';
import { DesbloqueioRepository } from '../repositories/desbloqueio-repository.js';
import { Clock } from '../clock/clock.js';
import { NotFoundError } from './errors.js';

export class RemoveBloqueioUseCase {
  constructor(
    private listBloqueiosUseCase: ListBloqueiosUseCase,
    private desbloqueioRepository: DesbloqueioRepository,
    private clock: Clock
  ) {}

  execute(participanteId: string): void {
    const bloqueios = this.listBloqueiosUseCase.execute();
    const bloqueio = bloqueios.find(b => b.participanteId === participanteId);
    if (!bloqueio) {
      throw new NotFoundError('Participante não está bloqueado');
    }

    const agora = this.clock.now();
    const agoraIso = agora.toISO();
    if (!agoraIso) {
      throw new Error('Data inválida do relógio');
    }

    this.desbloqueioRepository.upsert(participanteId, agoraIso);
  }
}
