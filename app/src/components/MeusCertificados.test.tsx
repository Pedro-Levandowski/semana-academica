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
    it('deve exibir a ação "Emitir certificado" para atividade elegível do extrato e chamar emitirCertificado com o ID correto', async () => {
    const getExtratoMock = vi.fn().mockResolvedValue({
      itens: [
        {
          atividadeId: 'atv_9x8y7z6w',
          titulo: 'Inteligência Artificial na prática',
          tipo: 'minicurso',
          cargaHorariaMinutos: 240,
          codigo: null,
        },
      ],
      palestrasMinutos: 0,
      minicursosMinutos: 240,
      totalMinutos: 240,
    });

    const emitirCertificadoMock = vi.fn().mockResolvedValue({
      codigo: 'SA26-4M5N-6P7Q',
      atividadeId: 'atv_9x8y7z6w',
      participanteId: 'p-carla',
      cargaHorariaMinutos: 240,
      presencas: 2,
      encontros: 2,
      emitidoEm: '2026-10-20T22:00:00-03:00',
    });

    const getCertificadosMock = vi.fn().mockResolvedValue([]);

    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
      emitirCertificado: emitirCertificadoMock,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const botao = await screen.findByRole('button', {
      name: 'Emitir certificado',
    });

    await act(async () => {
      botao.click();
    });

    expect(emitirCertificadoMock).toHaveBeenCalledWith('atv_9x8y7z6w');
  });

  it('deve apresentar feedback de sucesso e atualizar a listagem ao emitir com sucesso', async () => {
    const certificadoEmitidoDaAtividade = {
      codigo: 'SA26-4M5N-6P7Q',
      atividadeId: 'atv_9x8y7z6w',
      participanteId: 'p-carla',
      cargaHorariaMinutos: 240,
      presencas: 2,
      encontros: 2,
      emitidoEm: '2026-10-20T22:00:00-03:00',
    };

    const getExtratoMock = vi.fn().mockResolvedValue({
      itens: [
        {
          atividadeId: 'atv_9x8y7z6w',
          titulo: 'Inteligência Artificial na prática',
          tipo: 'minicurso',
          cargaHorariaMinutos: 240,
          codigo: null,
        },
      ],
      palestrasMinutos: 0,
      minicursosMinutos: 240,
      totalMinutos: 240,
    });

    const emitirCertificadoMock = vi
      .fn()
      .mockResolvedValue(certificadoEmitidoDaAtividade);

    const getCertificadosMock = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([certificadoEmitidoDaAtividade]);

    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
      emitirCertificado: emitirCertificadoMock,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const botao = await screen.findByRole('button', {
      name: 'Emitir certificado',
    });

    await act(async () => {
      botao.click();
    });

    expect(
      await screen.findByText(/emitido com sucesso/i)
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        `Código: ${certificadoEmitidoDaAtividade.codigo}`
      )
).toBeInTheDocument();
  });

  it('deve apresentar feedback compreensível quando a emissão falha com PRESENCA_INSUFICIENTE', async () => {
    const getExtratoMock = vi.fn().mockResolvedValue({
      itens: [
        {
          atividadeId: 'atv_9x8y7z6w',
          titulo: 'Inteligência Artificial na prática',
          tipo: 'minicurso',
          cargaHorariaMinutos: 240,
          codigo: null,
        },
      ],
      palestrasMinutos: 0,
      minicursosMinutos: 240,
      totalMinutos: 240,
    });

    const emitirCertificadoMock = vi.fn().mockRejectedValue({
      erro: 'PRESENCA_INSUFICIENTE',
      mensagem: 'Presença mínima de 75% não atingida',
    });

    const getCertificadosMock = vi.fn().mockResolvedValue([]);

    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
      emitirCertificado: emitirCertificadoMock,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const botao = await screen.findByRole('button', {
      name: 'Emitir certificado',
    });

    await act(async () => {
      botao.click();
    });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      /PRESENCA_INSUFICIENTE|presença mínima|não atingiu/i
    );
  });

  it('deve apresentar feedback compreensível quando a emissão falha com ATIVIDADE_NAO_ENCERRADA', async () => {
    const getExtratoMock = vi.fn().mockResolvedValue({
      itens: [
        {
          atividadeId: 'atv_9x8y7z6w',
          titulo: 'Inteligência Artificial na prática',
          tipo: 'minicurso',
          cargaHorariaMinutos: 240,
          codigo: null,
        },
      ],
      palestrasMinutos: 0,
      minicursosMinutos: 240,
      totalMinutos: 240,
    });

    const emitirCertificadoMock = vi.fn().mockRejectedValue({
      erro: 'ATIVIDADE_NAO_ENCERRADA',
      mensagem: 'A atividade ainda não foi encerrada',
    });

    const getCertificadosMock = vi.fn().mockResolvedValue([]);

    const fakeClient = {
      ...api,
      getExtrato: getExtratoMock,
      emitirCertificado: emitirCertificadoMock,
      getCertificados: getCertificadosMock,
    };

    render(
      <MeusCertificados
        selectedUserId="p-carla"
        userPapel="participante"
        apiClient={fakeClient}
      />
    );

    const botao = await screen.findByRole('button', {
      name: 'Emitir certificado',
    });

    await act(async () => {
      botao.click();
    });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      /ATIVIDADE_NAO_ENCERRADA|não foi encerrada/i
    );
  });
});