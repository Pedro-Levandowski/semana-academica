import { PainelQueryPort } from '../integrations/painel-query-port.js';
import { Clock } from '../clock/clock.js';
import { DateTime } from 'luxon';
import { NotFoundError } from './errors.js';

export class ExportFrequenciaCsvUseCase {
  constructor(
    private painelQueryPort: PainelQueryPort,
    private clock: Clock
  ) {}

  execute(atividadeId: string): Buffer {
    const atividades = this.painelQueryPort.listarAtividades();
    const atividade = atividades.find(a => a.id === atividadeId);
    if (!atividade) {
      throw new NotFoundError('Atividade não encontrada');
    }

    const agora = this.clock.now();

    const encontrosOrdenados = [...atividade.encontros].sort((a, b) => {
      const dtA = DateTime.fromISO(a.inicio, { setZone: true });
      const dtB = DateTime.fromISO(b.inicio, { setZone: true });
      if (dtA < dtB) return -1;
      if (dtA > dtB) return 1;
      return a.id.localeCompare(b.id);
    });

    const headers = ['nome', ...encontrosOrdenados.map((_, index) => `E${index + 1}`), 'frequencia', 'certificado'];

    if (atividade.cancelada) {
      const content = '\uFEFF' + headers.join(';') + '\n';
      return Buffer.from(content, 'utf8');
    }

    const confirmadas = atividade.inscricoes
      .filter(i => i.status === 'confirmada')
      .sort((a, b) => {
        const nomeA = (a.nome || '').localeCompare(b.nome || '');
        if (nomeA !== 0) return nomeA;
        return a.participanteId.localeCompare(b.participanteId);
      });

    const lines: string[] = [headers.join(';')];

    const atividadeEncerrada = encontrosOrdenados.length > 0 && encontrosOrdenados.every(e => {
      const fimDt = DateTime.fromISO(e.fim, { setZone: true });
      return fimDt <= agora;
    });

    for (const insc of confirmadas) {
      const row: string[] = [insc.nome || ''];
      let presencasCount = 0;

      for (const enc of encontrosOrdenados) {
        const fimDt = DateTime.fromISO(enc.fim, { setZone: true });
        const limiteJanela = fimDt.plus({ hours: 2 });
        const temPresenca = enc.presencas?.some(p => p.participanteId === insc.participanteId);

        if (temPresenca) {
          row.push('P');
          presencasCount++;
        } else if (agora > limiteJanela) {
          row.push('F');
        } else {
          row.push('-');
        }
      }

      const totalEncontros = encontrosOrdenados.length || 1;
      const freq = (presencasCount / totalEncontros) * 100;
      const freqStr = freq.toFixed(1).replace('.', ',');

      const elegivel = (presencasCount / totalEncontros) >= 0.75;
      const certificado = (atividadeEncerrada && elegivel) ? 'sim' : 'nao';
      row.push(freqStr);
      row.push(certificado);
      lines.push(row.join(';'));
    }

    const content = '\uFEFF' + lines.join('\n') + '\n';
    return Buffer.from(content, 'utf8');
  }
}
