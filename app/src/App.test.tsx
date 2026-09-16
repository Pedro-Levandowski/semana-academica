import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { INITIAL_USERS } from './users';
import { api } from './api/client';

describe('App Shell', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('deve renderizar o título principal do esqueleto', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Semana Acadêmica' })).toBeInTheDocument();
  });

  it('na primeira utilização, nenhuma pessoa está selecionada e aparece a orientação para selecionar um usuário', () => {
    render(<App />);

    const select = screen.getByLabelText('Selecione o usuário de demonstração:') as HTMLSelectElement;
    expect(select.value).toBe('');

    expect(screen.getByText(/Nenhum usuário selecionado/i)).toBeInTheDocument();
  });

  it('o seletor contém exatamente os 10 usuários e um placeholder', () => {
    render(<App />);

    const select = screen.getByLabelText('Selecione o usuário de demonstração:') as HTMLSelectElement;
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(11);
    expect(options[0].textContent).toBe('Selecione um usuário');

    INITIAL_USERS.forEach((user, index) => {
      const option = options[index + 1];
      expect(option.value).toBe(user.id);
      expect(option.textContent).toBe(`${user.nome} (${user.papel})`);
    });
  });

  it('escolher uma organização atualiza a interface e grava seu ID no localStorage', () => {
    render(<App />);

    const select = screen.getByLabelText('Selecione o usuário de demonstração:') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'org-ana' } });

    const userInfo = screen.getByTestId('active-user-info');
    expect(userInfo).toHaveTextContent('Usuário ativo: Ana Beatriz Lima (organizacao)');

    expect(localStorage.getItem('selectedUserId')).toBe('org-ana');
  });

  it('uma seleção válida armazenada é restaurada ao renderizar novamente', () => {
    localStorage.setItem('selectedUserId', 'org-bruno');

    render(<App />);

    const select = screen.getByLabelText('Selecione o usuário de demonstração:') as HTMLSelectElement;
    expect(select.value).toBe('org-bruno');

    const userInfo = screen.getByTestId('active-user-info');
    expect(userInfo).toHaveTextContent('Usuário ativo: Bruno Tavares (organizacao)');
  });

  it('o cliente HTTP adiciona X-Usuario sem que componentes construam o cabeçalho', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }],
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.getSalas();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/salas',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Usuario': 'p-carla',
        }),
      })
    );
  });

  it('deve exibir indicador de carregamento pendente "Carregando programação..." ao carregar atividades', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockReturnValue(pendingPromise),
    };

    render(<App apiClient={fakeClient} />);

    expect(screen.getByText('Carregando programação...')).toBeInTheDocument();

    resolvePromise([]);
  });

  it('deve exibir a listagem de atividades com sucesso após o carregamento', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([
        {
          id: 'atv_1',
          titulo: 'Palestra de React',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 40,
          encontros: [{ id: 'enc_1', inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }],
          cargaHorariaMinutos: 60,
          situacao: 'prevista',
          ocupadas: 10,
          vagasRestantes: 30,
          emEspera: 0,
        },
      ]),
    };

    render(<App apiClient={fakeClient} />);

    expect(await screen.findByText('Palestra de React')).toBeInTheDocument();
    expect(screen.getByText('Sala 101')).toBeInTheDocument();
    expect(screen.getByText('palestra')).toBeInTheDocument();
  });

  it('deve exibir mensagem explícita quando a lista de atividades estiver vazia', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} />);

    expect(await screen.findByText(/Nenhuma atividade encontrada/i)).toBeInTheDocument();
  });

  it('deve exibir erro contendo o código e a mensagem recebidos da API', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockRejectedValue({
        erro: 'ERRO_CUSTOMIZADO',
        mensagem: 'Falha grave ao carregar dados',
      }),
    };

    render(<App apiClient={fakeClient} />);

    expect(await screen.findByText(/ERRO_CUSTOMIZADO/)).toBeInTheDocument();
    expect(screen.getByText(/Falha grave ao carregar dados/)).toBeInTheDocument();
  });

  it('deve realizar nova consulta ao alterar o dia selecionado', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const getAtividadesMock = vi.fn().mockResolvedValue([]);
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: getAtividadesMock,
    };

    render(<App apiClient={fakeClient} />);

    await screen.findByText(/Nenhuma atividade encontrada/i);

    const btnDia20 = screen.getByRole('button', { name: /20\/10\/2026/i });
    fireEvent.click(btnDia20);

    expect(getAtividadesMock).toHaveBeenCalledWith(
      expect.objectContaining({ dia: '2026-10-20' })
    );
  });

  it('deve realizar nova consulta ao filtrar por tipo', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const getAtividadesMock = vi.fn().mockResolvedValue([]);
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: getAtividadesMock,
    };

    render(<App apiClient={fakeClient} />);

    await screen.findByText(/Nenhuma atividade encontrada/i);

    const selectTipo = screen.getByLabelText('Filtrar por tipo:');
    fireEvent.change(selectTipo, { target: { value: 'minicurso' } });

    expect(getAtividadesMock).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'minicurso' })
    );
  });

  it('deve combinar dia e tipo nas chamadas ao cliente', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const getAtividadesMock = vi.fn().mockResolvedValue([]);
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: getAtividadesMock,
    };

    render(<App apiClient={fakeClient} />);

    await screen.findByText(/Nenhuma atividade encontrada/i);

    const btnDia21 = screen.getByRole('button', { name: /21\/10\/2026/i });
    fireEvent.click(btnDia21);

    const selectTipo = screen.getByLabelText('Filtrar por tipo:');
    fireEvent.change(selectTipo, { target: { value: 'palestra' } });

    expect(getAtividadesMock).toHaveBeenLastCalledWith(
      { dia: '2026-10-21', tipo: 'palestra' }
    );
  });

  it('deve destacar visualmente atividades cancelada', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([
        {
          id: 'atv_cancelada',
          titulo: 'Minicurso Cancelado',
          tipo: 'minicurso',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ id: 'enc_1', inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T18:00:00-03:00' }],
          cargaHorariaMinutos: 240,
          situacao: 'cancelada',
          ocupadas: 0,
          vagasRestantes: 20,
          emEspera: 0,
        },
      ]),
    };

    render(<App apiClient={fakeClient} />);

    expect(await screen.findByText('Minicurso Cancelado')).toBeInTheDocument();
    expect(screen.getByText('(Cancelada)')).toBeInTheDocument();
  });
});
