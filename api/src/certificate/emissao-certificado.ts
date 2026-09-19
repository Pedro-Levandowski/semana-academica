import { DateTime } from 'luxon';
import { Clock } from '../clock/clock.js';
import { CertificateRepository } from '../repositories/certificate-repository.js';
import { M3PresencePort } from '../integrations/m3-presence-port.js';
import { M2IntegrationPort } from '../integrations/m2-port.js';
import { gerarCodigo } from './gerar-codigo.js';

export interface ActivitySnapshot {
  id: string;
  cargaHorariaMinutos: number;
  encontros: Array<{ inicio: string; fim: string }>;
  cancelada?: number;
}

export interface Certificado {
  codigo: string;
  atividadeId: string;
  participanteId: string;
  cargaHorariaMinutos: number;
  presencas: number;
  encontros: number;
  emitidoEm: string;
}

export type EmissaoResult =
  | { ok: true; certificado: Certificado; criado: boolean }
  | { ok: false; erro: 'ATIVIDADE_CANCELADA' | 'NAO_INSCRITO' | 'ATIVIDADE_NAO_ENCERRADA' | 'PRESENCA_INSUFICIENTE' };

export class EmitirCertificado {
  constructor(
    private readonly clock: Clock,
    private readonly presencasPort: M3PresencePort,
    private readonly repository: CertificateRepository,
    private readonly m2Port?: M2IntegrationPort
  ) {}

  execute(atividade: ActivitySnapshot, participanteId: string): EmissaoResult {
    if (atividade.cancelada === 1) {
      return { ok: false, erro: 'ATIVIDADE_CANCELADA' };
    }

    if (this.m2Port) {
      const inscricoes = this.m2Port.listarInscricoesDoParticipante?.(participanteId) ?? [];
      const inscricao = inscricoes.find((i) => i.atividadeId === atividade.id);
      if (!inscricao || inscricao.status !== 'confirmada') {
        return { ok: false, erro: 'NAO_INSCRITO' };
      }
    }

    const agora = this.clock.now();
    const ultimoEncontro = atividade.encontros[atividade.encontros.length - 1];
    const fimDoUltimoEncontro = DateTime.fromISO(ultimoEncontro.fim, { setZone: true });
    if (agora < fimDoUltimoEncontro) {
      return { ok: false, erro: 'ATIVIDADE_NAO_ENCERRADA' };
    }

    const encontros = atividade.encontros.length;
    const presencas = this.presencasPort.countPresencas(atividade.id, participanteId);
    if (presencas * 4 < encontros * 3) {
      return { ok: false, erro: 'PRESENCA_INSUFICIENTE' };
    }

    const existente = this.repository.findByAtividadeEParticipante(atividade.id, participanteId);
    if (existente) {
      return { ok: true, certificado: existente, criado: false };
    }

    const emitidoEm = agora.toISO();
    if (!emitidoEm) {
      throw new Error('Relógio retornou instante sem representação ISO 8601');
    }

    const certificado: Certificado = {
      codigo: gerarCodigo(),
      atividadeId: atividade.id,
      participanteId,
      cargaHorariaMinutos: atividade.cargaHorariaMinutos,
      presencas,
      encontros,
      emitidoEm
    };
    this.repository.create(certificado);
    return { ok: true, certificado, criado: true };
  }
}