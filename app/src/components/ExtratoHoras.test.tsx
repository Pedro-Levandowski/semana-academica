import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ExtratoHoras } from './ExtratoHoras';
import { api } from '../api/client';

describe('ExtratoHoras Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const extratoComItens = {
    itens: [
      {
        atividadeId: 'atv_1a2b3c4d',
        titulo: 'Flutter do zero',
        tipo: 'minicurso',
        cargaHorariaMinutos: 360,
        codigo: 'SA26-7K2M-9QXA',
      },
      {
        atividadeId: 'atv_5e6f7g8h',
        titulo: 'IA na educação',
        tipo: 'palestra',
        cargaHorariaMinutos: 120,
        codigo: null,
      },
      {
        atividadeId: 'atv_9i0j1k2l',
        titulo: 'Carreira em tecnologia',
        tipo: 'palestra',
        cargaHorariaMinutos: 150,
        codigo: null,
      },
    ],
    palestrasMinutos: 270,
    minicursosMinutos: 360,
    totalMinutos: 630,
    aproveitadoMinutos: 600,
  };

  it('deve exibir indicador de carregamento ao buscar o extrato', async () => {
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const getExtratoMock = vi.fn().mockReturnValue(pendingPromise);
    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
    };

    render(
      <ExtratoHoras
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Carregando extrato...')).toBeInTheDocument();

    await act(async () => {
      resolvePromise(extratoComItens);
    });
  });

  it('deve apresentar os itens do extrato e os quatro totais', async () => {
    const getExtratoMock = vi.fn().mockResolvedValue(extratoComItens);
    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
    };

    render(
      <ExtratoHoras
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const container = await screen.findByTestId('extrato-container');

    expect(getExtratoMock).toHaveBeenCalled();
    expect(container).toHaveTextContent('Flutter do zero');
    expect(container).toHaveTextContent('IA na educação');
    expect(container).toHaveTextContent('minicurso');
    expect(container).toHaveTextContent('palestra');
    expect(container).toHaveTextContent('360');
    expect(container).toHaveTextContent('120');
    expect(container).toHaveTextContent('SA26-7K2M-9QXA');

    const totaisEl = screen.getByTestId('extrato-totais');
    expect(totaisEl).toHaveTextContent('270');
    expect(totaisEl).toHaveTextContent('360');
    expect(totaisEl).toHaveTextContent('630');
    expect(totaisEl).toHaveTextContent('600');
  });

  it('deve indicar que um certificado ainda não foi emitido quando codigo é null', async () => {
    const getExtratoMock = vi.fn().mockResolvedValue(extratoComItens);
    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
    };

    render(
      <ExtratoHoras
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const container = await screen.findByTestId('extrato-container');

    expect(container).toHaveTextContent(/não emitido/i);
  });

  it('deve exibir estado vazio coerente quando não há atividades elegíveis', async () => {
    const fakeClient = {
      ...api,
      getExtrato: vi.fn().mockResolvedValue({
        itens: [],
        palestrasMinutos: 0,
        minicursosMinutos: 0,
        totalMinutos: 0,
        aproveitadoMinutos: 0,
      }),
    };

    render(
      <ExtratoHoras
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    expect(
      await screen.findByText(/nenhuma atividade elegível/i)
    ).toBeInTheDocument();
  });

  it('deve exibir role="alert" com código e mensagem do erro vindo da API', async () => {
    const getExtratoMock = vi.fn().mockRejectedValue({
      erro: 'ERRO_TESTE',
      mensagem: 'Falha ao consultar extrato',
    });
    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
    };

    render(
      <ExtratoHoras
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('ERRO_TESTE');
    expect(alert).toHaveTextContent('Falha ao consultar extrato');
  });

  it('organização não acessa o extrato e recebe aviso de área exclusiva de participantes', () => {
    const getExtratoMock = vi.fn().mockResolvedValue(extratoComItens);
    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
    };

    render(
      <ExtratoHoras
        selectedUserId="org-ana"
        userPapel="organizacao"
        apiClient={fakeClient}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Área exclusiva de participantes' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Acesso negado ou usuário não autorizado.')
    ).toBeInTheDocument();
    expect(getExtratoMock).not.toHaveBeenCalled();
  });
});