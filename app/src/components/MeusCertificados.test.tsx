import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MeusCertificados } from './MeusCertificados';
import { api } from '../api/client';
import { formatarDataHoraBrasilia } from '../utils/date';

describe('MeusCertificados Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const certificadoEmitido = {
    codigo: 'SA26-7K2M-9QXA',
    atividadeId: 'atv_1a2b3c4d',
    participanteId: 'p-carla',
    cargaHorariaMinutos: 360,
    presencas: 2,
    encontros: 2,
    emitidoEm: '2026-10-19T22:00:00-03:00',
  };

  it('deve exibir indicador de carregamento ao buscar os certificados', async () => {
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const getCertificadosMock = vi.fn().mockReturnValue(pendingPromise);
    const fakeClient = {
      ...api,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Carregando certificados...')).toBeInTheDocument();

    await act(async () => {
      resolvePromise([]);
    });
  });

  it('deve apresentar os dados do certificado emitido disponíveis no contrato', async () => {
    const getCertificadosMock = vi.fn().mockResolvedValue([certificadoEmitido]);
    const fakeClient = {
      ...api,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const container = await screen.findByTestId('meus-certificados-container');

    expect(getCertificadosMock).toHaveBeenCalled();
    expect(container).toHaveTextContent('SA26-7K2M-9QXA');
    expect(container).toHaveTextContent('360');
    expect(container).toHaveTextContent('2');
    expect(container).toHaveTextContent(
      formatarDataHoraBrasilia(certificadoEmitido.emitidoEm)
    );
  });

  it('deve exibir mensagem coerente quando ainda não há certificados emitidos', async () => {
    const fakeClient = {
      ...api,
      getCertificados: vi.fn().mockResolvedValue([]),
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    expect(
      await screen.findByText(/não possui certificados/i)
    ).toBeInTheDocument();
  });

  it('deve exibir role="alert" com código e mensagem do erro vindo da API', async () => {
    const getCertificadosMock = vi.fn().mockRejectedValue({
      erro: 'ERRO_CERTIFICADOS',
      mensagem: 'Falha ao carregar os certificados',
    });
    const fakeClient = {
      ...api,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('ERRO_CERTIFICADOS');
    expect(alert).toHaveTextContent('Falha ao carregar os certificados');
  });

  it('organização não acessa o conteúdo e recebe aviso de área exclusiva de participantes', () => {
    const getCertificadosMock = vi.fn().mockResolvedValue([certificadoEmitido]);
    const fakeClient = {
      ...api,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
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
    expect(getCertificadosMock).not.toHaveBeenCalled();
  });
});