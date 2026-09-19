import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { M2ExtensionPoint } from './components/M2ExtensionPoint';
import { Atividade } from './api/types';

describe('M2ExtensionPoint - Inscrição do Participante', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockAtividade: Atividade = {
    id: 'atv_100',
    titulo: 'Minicurso TDD',
    tipo: 'minicurso',
    salaId: 'lab-3',
    vagas: 20,
    encontros: [],
    cargaHorariaMinutos: 180,
    situacao: 'prevista',
    ocupadas: 5,
    vagasRestantes: 15,
    emEspera: 0,
  };

  it('deve exibir o botão Inscrever-se para participante não inscrito e realizar a inscrição com sucesso', async () => {
    const createInscricaoMock = vi.fn().mockResolvedValue({
      id: 'ins_1',
      atividadeId: 'atv_100',
      participanteId: 'p-carla',
      status: 'confirmada',
      posicaoNaEspera: null,
      convocadaAte: null,
      criadaEm: '2026-10-19T10:00:00-03:00',
    });

    const fakeClient: any = {
      getInscricoes: vi.fn().mockResolvedValue([]),
      createInscricao: createInscricaoMock,
    };

    render(
      <MemoryRouter>
        <M2ExtensionPoint
          atividade={mockAtividade}
          selectedUserId="p-carla"
          userPapel="participante"
          apiClient={fakeClient}
        />
      </MemoryRouter>
    );

    const btnInscrever = await screen.findByRole('button', { name: /Inscrever-se/i });
    expect(btnInscrever).toBeInTheDocument();

    fireEvent.click(btnInscrever);

    expect(createInscricaoMock).toHaveBeenCalledWith('atv_100');
    expect(await screen.findByText(/Inscrição realizada com sucesso!/i)).toBeInTheDocument();
  });

  it('deve exibir posição na fila para inscrição em_espera e permitir cancelamento', async () => {
    const cancelInscricaoMock = vi.fn().mockResolvedValue({
      id: 'ins_2',
      atividadeId: 'atv_100',
      participanteId: 'p-carla',
      status: 'cancelada',
      posicaoNaEspera: null,
      convocadaAte: null,
      criadaEm: '2026-10-19T10:00:00-03:00',
    });

    const fakeClient: any = {
      getInscricoes: vi.fn().mockResolvedValue([
        {
          id: 'ins_2',
          atividadeId: 'atv_100',
          participanteId: 'p-carla',
          status: 'em_espera',
          posicaoNaEspera: 3,
          convocadaAte: null,
          criadaEm: '2026-10-19T10:00:00-03:00',
        },
      ]),
      cancelInscricao: cancelInscricaoMock,
    };

    render(
      <MemoryRouter>
        <M2ExtensionPoint
          atividade={mockAtividade}
          selectedUserId="p-carla"
          userPapel="participante"
          apiClient={fakeClient}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Posição na fila:/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    const btnCancelar = screen.getAllByRole('button', { name: /Cancelar Inscrição/i })[0];
    fireEvent.click(btnCancelar);

    expect(cancelInscricaoMock).toHaveBeenCalledWith('ins_2');
    expect(await screen.findByText(/Inscrição cancelada com sucesso!/i)).toBeInTheDocument();
  });

  it('deve exibir contagem regressiva para convocação usando fake timers e permitir confirmação de vaga', async () => {
    const baseTime = new Date('2026-10-19T10:00:00-03:00').getTime();
    const convocadaAte = new Date(baseTime + 10 * 60 * 1000).toISOString(); // 10 mins in future

    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(baseTime);

    const confirmInscricaoMock = vi.fn().mockResolvedValue({
      id: 'ins_3',
      atividadeId: 'atv_100',
      participanteId: 'p-carla',
      status: 'confirmada',
      posicaoNaEspera: null,
      convocadaAte: null,
      criadaEm: '2026-10-19T09:00:00-03:00',
    });

    const fakeClient: any = {
      getInscricoes: vi.fn().mockResolvedValue([
        {
          id: 'ins_3',
          atividadeId: 'atv_100',
          participanteId: 'p-carla',
          status: 'convocada',
          posicaoNaEspera: null,
          convocadaAte,
          criadaEm: '2026-10-19T09:00:00-03:00',
        },
      ]),
      confirmInscricao: confirmInscricaoMock,
    };

    render(
      <MemoryRouter>
        <M2ExtensionPoint
          atividade={mockAtividade}
          selectedUserId="p-carla"
          userPapel="participante"
          apiClient={fakeClient}
        />
      </MemoryRouter>
    );

    const timerElem = await screen.findByTestId('countdown-timer');
    expect(timerElem.textContent).toBe('10:00');

    // Advance 60 seconds with fake timers
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(timerElem.textContent).toBe('09:00');

    const btnConfirmar = screen.getAllByRole('button', { name: /Confirmar Vaga/i })[0];
    fireEvent.click(btnConfirmar);

    expect(confirmInscricaoMock).toHaveBeenCalledWith('ins_3');
    expect(await screen.findByText(/Convocação confirmada com sucesso!/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('deve listar todas as inscrições do participante na seção Minhas Inscrições', async () => {
    const fakeClient: any = {
      getInscricoes: vi.fn().mockResolvedValue([
        {
          id: 'ins_10',
          atividadeId: 'atv_100',
          participanteId: 'p-carla',
          status: 'confirmada',
          posicaoNaEspera: null,
          convocadaAte: null,
          criadaEm: '2026-10-19T09:00:00-03:00',
        },
        {
          id: 'ins_11',
          atividadeId: 'atv_200',
          participanteId: 'p-carla',
          status: 'cancelada',
          posicaoNaEspera: null,
          convocadaAte: null,
          criadaEm: '2026-10-18T09:00:00-03:00',
        },
      ]),
    };

    render(
      <MemoryRouter>
        <M2ExtensionPoint
          selectedUserId="p-carla"
          userPapel="participante"
          apiClient={fakeClient}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Minhas Inscrições/i })).toBeInTheDocument();
    expect(screen.getByText(/Inscrição ins_10/i)).toBeInTheDocument();
    expect(screen.getByText(/Inscrição ins_11/i)).toBeInTheDocument();
    expect(screen.getByText('confirmada')).toBeInTheDocument();
    expect(screen.getByText('cancelada')).toBeInTheDocument();
  });

  it('deve exibir lista de inscritos e fila de espera quando acessado pela organização', async () => {
    const fakeClient: any = {
      getInscricoes: vi.fn().mockResolvedValue([
        {
          id: 'ins_30',
          atividadeId: 'atv_100',
          participanteId: 'p-carla',
          status: 'confirmada',
          posicaoNaEspera: null,
          convocadaAte: null,
          criadaEm: '2026-10-19T09:00:00-03:00',
        },
        {
          id: 'ins_31',
          atividadeId: 'atv_100',
          participanteId: 'p-diego',
          status: 'em_espera',
          posicaoNaEspera: 1,
          convocadaAte: null,
          criadaEm: '2026-10-19T09:05:00-03:00',
        },
      ]),
    };

    render(
      <MemoryRouter>
        <M2ExtensionPoint
          atividade={mockAtividade}
          selectedUserId="org-ana"
          userPapel="organizacao"
          apiClient={fakeClient}
        />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Inscritos e Fila de Espera/i })).toBeInTheDocument();
    expect(fakeClient.getInscricoes).toHaveBeenCalledWith({ atividadeId: 'atv_100' });
    expect(screen.getByText(/Participante: p-carla/i)).toBeInTheDocument();
    expect(screen.getByText(/Participante: p-diego/i)).toBeInTheDocument();
    expect(screen.getByText(/Posição: 1/i)).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro legível quando a API recusar a inscrição', async () => {
    const fakeClient: any = {
      getInscricoes: vi.fn().mockResolvedValue([]),
      createInscricao: vi.fn().mockRejectedValue({
        erro: 'CONFLITO_DE_HORARIO',
        mensagem: 'Existe sobreposição de horário com outra atividade',
      }),
    };

    render(
      <MemoryRouter>
        <M2ExtensionPoint
          atividade={mockAtividade}
          selectedUserId="p-carla"
          userPapel="participante"
          apiClient={fakeClient}
        />
      </MemoryRouter>
    );

    const btnInscrever = await screen.findByRole('button', { name: /Inscrever-se/i });
    fireEvent.click(btnInscrever);

    expect(await screen.findByRole('alert')).toHaveTextContent(/CONFLITO_DE_HORARIO/i);
    expect(screen.getByText(/Existe sobreposição de horário com outra atividade/i)).toBeInTheDocument();
  });
});
