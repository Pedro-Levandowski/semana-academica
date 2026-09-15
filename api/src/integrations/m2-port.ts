export interface M2IntegrationPort {
  getOcupadas(atividadeId: string): number;
  getEmEspera(atividadeId: string): number;
  convocarEspera(atividadeId: string): void;
}

export class NeutralM2Adapter implements M2IntegrationPort {
  getOcupadas(_atividadeId: string): number {
    return 0;
  }

  getEmEspera(_atividadeId: string): number {
    return 0;
  }

  convocarEspera(_atividadeId: string): void {
    // no-op
  }
}
