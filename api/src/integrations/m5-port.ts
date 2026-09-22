import { DateTime } from 'luxon';

export interface M5IntegrationPort {
  isParticipantBlocked(participanteId: string, agora: DateTime): boolean;
}

export interface BloqueiosQueryPort {
  execute(): { participanteId: string }[];
}

export class NeutralM5Adapter implements M5IntegrationPort {
  isParticipantBlocked(_participanteId: string, _agora: DateTime): boolean {
    return false;
  }
}

export class SQLiteM5Adapter implements M5IntegrationPort {
  constructor(private bloqueiosQuery: BloqueiosQueryPort) {}

  isParticipantBlocked(participanteId: string, _agora: DateTime): boolean {
    const bloqueios = this.bloqueiosQuery.execute();
    return bloqueios.some(b => b.participanteId === participanteId);
  }
}
