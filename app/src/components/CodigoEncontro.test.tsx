import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CodigoEncontro } from './CodigoEncontro';
import { api } from '../api/client';

describe('CodigoEncontro Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve exibir indicador de carregamento ao buscar o código do encontro', async () => {
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const fakeClient = {
      ...api,
      getCodigoEncontro: vi.fn().mockReturnValue(pendingPromise),
    };

    render(<CodigoEncontro encontroId="enc_1" apiClient={fakeClient} />);

    expect(screen.getByText('Carregando código do encontro...')).toBeInTheDocument();

    await act(async () => {
      resolvePromise({
        encontroId: 'enc_1',
        codigo: 'ABC123',
        trocaEm: new Date(Date.now() + 5000).toISOString(),
        validoAte: new Date(Date.now() + 10000).toISOString(),
      });
    });
  });

  it('deve exibir o código em destaque e a próxima troca com sucesso', async () => {
    const fakeClient = {
      ...api,
      getCodigoEncontro: vi.fn().mockResolvedValue({
        encontroId: 'enc_1',
        codigo: 'K7M2QX',
        trocaEm: new Date(Date.now() + 5000).toISOString(),
        validoAte: new Date(Date.now() + 10000).toISOString(),
      }),
    };

    render(<CodigoEncontro encontroId="enc_1" apiClient={fakeClient} />);

    expect(await screen.findByTestId('codigo-valor')).toHaveTextContent('K7M2QX');
    expect(screen.getByTestId('proxima-troca')).toBeInTheDocument();
  });

  it('deve atualizar automaticamente o código buscando o próximo quando o tempo de trocaEm for atingido', async () => {
    vi.useFakeTimers();

    const getCodigoMock = vi.fn()
      .mockResolvedValueOnce({
        encontroId: 'enc_1',
        codigo: 'CODE1',
        trocaEm: new Date(Date.now() + 1000).toISOString(),
        validoAte: new Date(Date.now() + 2000).toISOString(),
      })
      .mockResolvedValueOnce({
        encontroId: 'enc_1',
        codigo: 'CODE2',
        trocaEm: new Date(Date.now() + 5000).toISOString(),
        validoAte: new Date(Date.now() + 7000).toISOString(),
      });

    const fakeClient = {
      ...api,
      getCodigoEncontro: getCodigoMock,
    };

    render(<CodigoEncontro encontroId="enc_1" apiClient={fakeClient} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('codigo-valor')).toHaveTextContent('CODE1');

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByTestId('codigo-valor')).toHaveTextContent('CODE2');
    expect(getCodigoMock).toHaveBeenCalledTimes(2);
  });

  it('deve tratar o erro FORA_DA_JANELA mostrando mensagem clara e sem tentar novas chamadas', async () => {
    const getCodigoMock = vi.fn().mockRejectedValue({
      erro: 'FORA_DA_JANELA',
      mensagem: 'Fora do horário permitido para este encontro',
    });

    const fakeClient = {
      ...api,
      getCodigoEncontro: getCodigoMock,
    };

    render(<CodigoEncontro encontroId="enc_1" apiClient={fakeClient} />);

    expect(await screen.findByTestId('error-fora-janela')).toBeInTheDocument();
    expect(screen.getByText('Fora do horário permitido.')).toBeInTheDocument();
    expect(screen.getByText('Fora do horário permitido para este encontro')).toBeInTheDocument();
    expect(getCodigoMock).toHaveBeenCalledTimes(1);
  });

  it('deve tratar o erro ATIVIDADE_CANCELADA mostrando mensagem de que a atividade foi cancelada', async () => {
    const fakeClient = {
      ...api,
      getCodigoEncontro: vi.fn().mockRejectedValue({
        erro: 'ATIVIDADE_CANCELADA',
        mensagem: 'A atividade deste encontro foi cancelada',
      }),
    };

    render(<CodigoEncontro encontroId="enc_1" apiClient={fakeClient} />);

    expect(await screen.findByTestId('error-cancelada')).toBeInTheDocument();
    expect(screen.getByText('Atividade cancelada.')).toBeInTheDocument();
    expect(screen.getByText('A atividade deste encontro foi cancelada')).toBeInTheDocument();
  });

  it('deve tratar erro de rede genérico', async () => {
    const fakeClient = {
      ...api,
      getCodigoEncontro: vi.fn().mockRejectedValue({
        erro: 'ERRO_DE_REDE',
        mensagem: 'Falha de comunicação com o servidor',
      }),
    };

    render(<CodigoEncontro encontroId="enc_1" apiClient={fakeClient} />);

    expect(await screen.findByTestId('error-generico')).toBeInTheDocument();
    expect(screen.getByText(/ERRO_DE_REDE/)).toBeInTheDocument();
    expect(screen.getByText(/Falha de comunicação com o servidor/)).toBeInTheDocument();
  });

  it('deve tentar novamente automaticamente após alguns segundos quando ocorrer um erro genérico de rede', async () => {
    vi.useFakeTimers();

    const getCodigoMock = vi.fn()
      .mockRejectedValueOnce({
        erro: 'ERRO_DE_REDE',
        mensagem: 'Falha temporária',
      })
      .mockResolvedValueOnce({
        encontroId: 'enc_1',
        codigo: 'RETRYOK',
        trocaEm: new Date(Date.now() + 10000).toISOString(),
        validoAte: new Date(Date.now() + 15000).toISOString(),
      });

    const fakeClient = {
      ...api,
      getCodigoEncontro: getCodigoMock,
    };

    render(<CodigoEncontro encontroId="enc_1" apiClient={fakeClient} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('error-generico')).toBeInTheDocument();
    expect(getCodigoMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(screen.getByTestId('codigo-valor')).toHaveTextContent('RETRYOK');
    expect(getCodigoMock).toHaveBeenCalledTimes(2);
  });
});
