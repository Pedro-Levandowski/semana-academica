import { describe, expect, it, vi } from 'vitest';
import { SQLitePainelQueryAdapter } from '../src/integrations/painel-query-port.js';
import type { M1PainelSourcePort } from '../src/integrations/m1-painel-source-port.js';
import type { M2PainelSourcePort } from '../src/integrations/m2-painel-source-port.js';
import type { M3PainelSourcePort } from '../src/integrations/m3-painel-source-port.js';
import fs from 'fs';
import path from 'path';

describe('M5 - integração exclusivamente por portas (R18)', () => {
  it('compõe o retrato do painel somente pelas portas explícitas de M1, M2 e M3', () => {
    const m1Port: M1PainelSourcePort = {
      listarAtividadesParaPainel: vi.fn().mockReturnValue([
        {
          id: 'atv-portas',
          titulo: 'Atividade por portas',
          vagas: 10,
          cancelada: false,
          encontros: [
            {
              id: 'enc-portas',
              inicio: '2026-10-20T08:00:00-03:00',
              fim: '2026-10-20T09:00:00-03:00'
            }
          ]
        }
      ])
    };
    const m2Port: M2PainelSourcePort = {
      listarInscricoesParaPainel: vi.fn().mockReturnValue([
        {
          atividadeId: 'atv-portas',
          participanteId: 'p-portas',
          nome: 'Participante pelas portas',
          status: 'confirmada'
        }
      ])
    };
    const m3Port: M3PainelSourcePort = {
      listarPresencasDoEncontroParaPainel: vi.fn().mockReturnValue([
        { participanteId: 'p-portas', origem: 'manual' }
      ])
    };

    const adapter = new SQLitePainelQueryAdapter(m1Port, m2Port, m3Port);

    expect(adapter.listarAtividades()).toEqual([
      {
        id: 'atv-portas',
        titulo: 'Atividade por portas',
        vagas: 10,
        cancelada: false,
        encontros: [
          {
            id: 'enc-portas',
            inicio: '2026-10-20T08:00:00-03:00',
            fim: '2026-10-20T09:00:00-03:00',
            presencas: [{ participanteId: 'p-portas', origem: 'manual' }]
          }
        ],
        inscricoes: [
          {
            participanteId: 'p-portas',
            nome: 'Participante pelas portas',
            status: 'confirmada'
          }
        ]
      }
    ]);
    expect(m1Port.listarAtividadesParaPainel).toHaveBeenCalledOnce();
    expect(m2Port.listarInscricoesParaPainel).toHaveBeenCalledOnce();
    expect(m3Port.listarPresencasDoEncontroParaPainel).toHaveBeenCalledWith('enc-portas');
  });

  it('impede que o adaptador do M5 importe repositórios internos de outros módulos', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/integrations/painel-query-port.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/repositories\//);
    expect(source).toContain('M1PainelSourcePort');
    expect(source).toContain('M2PainelSourcePort');
    expect(source).toContain('M3PainelSourcePort');
  });
});
