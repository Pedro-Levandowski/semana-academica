import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './client';
import { ApiError } from './types';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('deve listar salas usando GET /salas sem X-Usuario quando nenhum usuário estiver selecionado', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }],
    });
    vi.stubGlobal('fetch', mockFetch);

    const salas = await api.getSalas();

    expect(salas).toEqual([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/salas',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'X-Usuario': expect.any(String),
        }),
      })
    );
  });

  it('deve incluir X-Usuario automaticamente quando houver usuário selecionado no localStorage', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.getAtividades();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Usuario': 'org-ana',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('deve passar filtros opcionais em getAtividades', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.getAtividades({ dia: '2026-10-19', tipo: 'palestra' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades?dia=2026-10-19&tipo=palestra',
      expect.any(Object)
    );
  });

  it('deve consultar detalhe de atividade em GET /atividades/:id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'atv_123', titulo: 'Teste' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const atv = await api.getAtividade('atv_123');
    expect(atv).toEqual({ id: 'atv_123', titulo: 'Teste' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades/atv_123',
      expect.any(Object)
    );
  });

  it('deve criar atividade via POST /atividades', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'atv_123', titulo: 'Nova' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const nova = {
      titulo: 'Nova',
      tipo: 'palestra' as const,
      salaId: 'sala-101',
      vagas: 40,
      encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }],
    };

    const res = await api.createAtividade(nova);
    expect(res).toEqual({ id: 'atv_123', titulo: 'Nova' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(nova),
      })
    );
  });

  it('deve editar atividade via PATCH /atividades/:id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'atv_123', titulo: 'Editada' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.updateAtividade('atv_123', { titulo: 'Editada' });
    expect(res).toEqual({ id: 'atv_123', titulo: 'Editada' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades/atv_123',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ titulo: 'Editada' }),
      })
    );
  });

  it('deve cancelar atividade via POST /atividades/:id/cancelamento', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'atv_123', situacao: 'cancelada' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.cancelAtividade('atv_123');
    expect(res).toEqual({ id: 'atv_123', situacao: 'cancelada' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades/atv_123/cancelamento',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('deve obter código do encontro em GET /encontros/:id/codigo', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ encontroId: 'enc_1', codigo: 'K7M2QX', trocaEm: '...', validoAte: '...' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.getCodigoEncontro('enc_1');
    expect(res).toEqual({ encontroId: 'enc_1', codigo: 'K7M2QX', trocaEm: '...', validoAte: '...' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/encontros/enc_1/codigo',
      expect.any(Object)
    );
  });

  it('deve registrar presença via POST /encontros/:id/presencas', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'pre_1', encontroId: 'enc_1', participanteId: 'p-carla', origem: 'qr', lidoEm: '...', registradaEm: '...', justificativa: null }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const payload = { codigo: 'K7M2QX', lidoEm: '2026-10-19T10:00:00-03:00' };
    const res = await api.registrarPresenca('enc_1', payload);
    expect(res).toEqual({
      presenca: { id: 'pre_1', encontroId: 'enc_1', participanteId: 'p-carla', origem: 'qr', lidoEm: '...', registradaEm: '...', justificativa: null },
      status: 201,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/encontros/enc_1/presencas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('deve registrar presença manual via POST /encontros/:id/presencas/manual', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'pre_1', encontroId: 'enc_1', participanteId: 'p-carla', origem: 'manual', lidoEm: '...', registradaEm: '...', justificativa: 'Justificativa válida' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const payload = { participanteId: 'p-carla', justificativa: 'Justificativa válida' };
    const res = await api.registrarPresencaManual('enc_1', payload);
    expect(res).toEqual({
      presenca: { id: 'pre_1', encontroId: 'enc_1', participanteId: 'p-carla', origem: 'manual', lidoEm: '...', registradaEm: '...', justificativa: 'Justificativa válida' },
      status: 201,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/encontros/enc_1/presencas/manual',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('deve listar presenças do encontro em GET /encontros/:id/presencas', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'pre_1', encontroId: 'enc_1', participanteId: 'p-carla', origem: 'qr', lidoEm: '...', registradaEm: '...', justificativa: null }],
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.getPresencas('enc_1');
    expect(res).toEqual([{ id: 'pre_1', encontroId: 'enc_1', participanteId: 'p-carla', origem: 'qr', lidoEm: '...', registradaEm: '...', justificativa: null }]);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/encontros/enc_1/presencas',
      expect.any(Object)
    );
  });

  it('deve suporte a chamadas de inscricoes (getInscricoes, createInscricao, confirmInscricao, cancelInscricao)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'ins_1', atividadeId: 'atv_1', participanteId: 'p-carla', status: 'confirmada' }],
    });
    vi.stubGlobal('fetch', mockFetch);

    const inscricoes = await (api as any).getInscricoes({ atividadeId: 'atv_1' });
    expect(inscricoes).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/inscricoes?atividadeId=atv_1',
      expect.any(Object)
    );
  });

  it('deve lançar ApiError contendo erro e mensagem quando a resposta não for ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Usuário não encontrado' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(api.getSalas()).rejects.toThrowError(ApiError);
    try {
      await api.getSalas();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(401);
      expect(err.erro).toBe('USUARIO_DESCONHECIDO');
      expect(err.mensagem).toBe('Usuário não encontrado');
    }
  });
});

describe('API Client - M4 Certificados', () => {
  const certificado = {
    codigo: 'SA26-7K2M-9QXA',
    atividadeId: 'atv_1a2b3c4d',
    participanteId: 'p-carla',
    cargaHorariaMinutos: 360,
    presencas: 2,
    encontros: 2,
    emitidoEm: '2026-10-23T22:00:00-03:00',
  };

  it('deve listar certificados usando GET /certificados', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [certificado],
    });
    vi.stubGlobal('fetch', mockFetch);

    const certificados = await api.getCertificados();

    expect(certificados).toEqual([certificado]);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/certificados');
    expect(options.method).toBeUndefined();
  });

  it('deve consultar o extrato de horas usando GET /extrato', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        itens: [
          {
            atividadeId: 'atv_1a2b3c4d',
            titulo: 'Flutter do zero',
            tipo: 'minicurso',
            cargaHorariaMinutos: 360,
            codigo: null,
          },
        ],
        palestrasMinutos: 0,
        minicursosMinutos: 360,
        totalMinutos: 360,
        aproveitadoMinutos: 360,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const extrato = await api.getExtrato();

    expect(extrato.totalMinutos).toBe(360);
    expect(extrato.aproveitadoMinutos).toBe(360);
    expect(extrato.itens).toHaveLength(1);
    expect(extrato.itens).toEqual([
      {
        atividadeId: 'atv_1a2b3c4d',
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        cargaHorariaMinutos: 360,
        codigo: null,
      },
    ]);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/extrato');
    expect(options.method).toBeUndefined();
  });

  it('deve consultar a verificação pública em GET /certificados/:codigo codificando o código na URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        codigo: 'SA26-7K2M-9QXA',
        participante: 'Carla M. S.',
        atividade: 'Flutter do zero',
        cargaHorariaMinutos: 360,
        emitidoEm: '2026-10-23T22:00:00-03:00',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const verificacao = await api.getCertificadoPorCodigo('SA26-7K2M 9QXA');

    expect(verificacao.codigo).toBe('SA26-7K2M-9QXA');
    expect(verificacao.participante).toBe('Carla M. S.');
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/certificados/SA26-7K2M%209QXA');
    expect(options.method).toBeUndefined();
  });

  it('deve consultar a verificação pública sem X-Usuario quando nenhum usuário estiver selecionado', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        codigo: 'SA26-7K2M-9QXA',
        participante: 'Carla M. S.',
        atividade: 'Flutter do zero',
        cargaHorariaMinutos: 360,
        emitidoEm: '2026-10-23T22:00:00-03:00',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.getCertificadoPorCodigo('SA26-7K2M-9QXA');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/certificados/SA26-7K2M-9QXA',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'X-Usuario': expect.any(String),
        }),
      })
    );
  });

  it('deve emitir certificado via POST /atividades/:id/certificado sem enviar corpo', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => certificado,
    });
    vi.stubGlobal('fetch', mockFetch);

    const emitido = await api.emitirCertificado('atv_1a2b3c4d');

    expect(emitido).toEqual(certificado);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/atividades/atv_1a2b3c4d/certificado');
    expect(options.method).toBe('POST');
    expect(options).not.toHaveProperty('body');
  });
});