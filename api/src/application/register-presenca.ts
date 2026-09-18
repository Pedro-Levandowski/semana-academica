import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository } from '../repositories/inscricao-repository.js';
import { PresencaRepository, PresencaRow } from '../repositories/presenca-repository.js';
import { Clock } from '../clock/clock.js';
import { DomainError } from '../domain/activity.js';
import { NotFoundError } from './errors.js';
import { DateTime } from 'luxon';
import crypto from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateCode(encontroId: string, refTime: DateTime): string {
  const minuteBucket = refTime.toFormat('yyyy-MM-dd\'T\'HH:mm');
  const hash = crypto.createHash('sha256').update(`${encontroId}-${minuteBucket}`).digest();
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    const byte = hash[i];
    codigo += ALPHABET[byte % ALPHABET.length];
  }
  return codigo;
}

export class RegisterPresencaUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private inscricaoRepository: InscricaoRepository,
    private presencaRepository: PresencaRepository,
    private clock: Clock
  ) {}

  execute(encontroId: string, participanteId: string, input: { codigo: string; lidoEm?: string }): { presenca: PresencaRow; statusCode: number } {
    const result = this.activityRepository.findEncounterWithActivity(encontroId);
    if (!result) {
      throw new NotFoundError('Encontro não encontrado');
    }

    // Idempotency: check existing presence before anything else (except 404)
    const existing = this.presencaRepository.findByEncontroAndParticipante(encontroId, participanteId);
    if (existing) {
      return { presenca: existing, statusCode: 200 };
    }

    // Inscrição confirmada (R9)
    const statusInscricao = this.inscricaoRepository.findStatus(result.activity.id, participanteId);
    if (statusInscricao !== 'confirmada') {
      throw new DomainError('NAO_INSCRITO', 'Participante sem inscrição confirmada');
    }

    const agora = this.clock.now();
    const inicio = DateTime.fromISO(result.encounter.inicio, { setZone: true });
    const fim = DateTime.fromISO(result.encounter.fim, { setZone: true });

    // Sincronização tardia (R5): envio até 2 horas depois do fim do encontro
    const limiteSincronizacao = fim.plus({ hours: 2 });
    if (agora > limiteSincronizacao) {
      throw new DomainError('SINCRONIZACAO_TARDIA', 'Sincronização tardia');
    }

    // lidoEm vs agora (R13, R17) e Origem (R18)
    let refTime = agora;
    let origem = 'qr';
    if (input.lidoEm !== undefined) {
      origem = 'qr_offline';
      const parsedLidoEm = DateTime.fromISO(input.lidoEm, { setZone: true });
      if (parsedLidoEm.isValid) {
        if (parsedLidoEm > agora) {
          refTime = agora; // R17: relógio adiantado
        } else {
          refTime = parsedLidoEm;
        }
      }
    }

    // Window check (R1, R5)
    const janelaInicio = inicio.minus({ minutes: 15 });
    const janelaFim = inicio.plus({ minutes: 30 });
    if (refTime < janelaInicio || refTime > janelaFim) {
      throw new DomainError('FORA_DA_JANELA', 'Fora da janela de registro de presença');
    }

    // Validação do código (R4, R10, R11)
    if (!input.codigo || typeof input.codigo !== 'string') {
      throw new DomainError('CODIGO_INVALIDO', 'Código inválido');
    }
    const codigoNormalizado = input.codigo.replace(/\s+/g, '').toUpperCase();
    const codigoAtual = generateCode(encontroId, refTime);
    const codigoAnterior = generateCode(encontroId, refTime.minus({ minutes: 1 }));

    if (codigoNormalizado !== codigoAtual && codigoNormalizado !== codigoAnterior) {
      throw new DomainError('CODIGO_INVALIDO', 'Código inválido');
    }

    const id = 'pre_' + crypto.randomBytes(4).toString('hex');
    const presenca: PresencaRow = {
      id,
      encontroId,
      participanteId,
      origem,
      lidoEm: refTime.toISO()!,
      registradaEm: agora.toISO()!,
      justificativa: null
    };

    this.presencaRepository.create(presenca);

    return { presenca, statusCode: 201 };
  }
}
