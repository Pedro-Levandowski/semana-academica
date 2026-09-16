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

  it('deve navegar da programação para a página de detalhes com o ID correto ao clicar em "Ver detalhes"', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([
        {
          id: 'atv_xyz',
          titulo: 'Palestra Teste Roteador',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 40,
          encontros: [{ id: 'enc_1', inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }],
          cargaHorariaMinutos: 60,
          situacao: 'prevista',
          ocupadas: 5,
          vagasRestantes: 35,
          emEspera: 0,
        },
      ]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_xyz',
        titulo: 'Palestra Teste Roteador',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 40,
        encontros: [{ id: 'enc_1', inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 5,
        vagasRestantes: 35,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} />);

    const linkDetalhes = await screen.findByText('Ver detalhes');
    fireEvent.click(linkDetalhes);

    expect(await screen.findByText('Palestra Teste Roteador')).toBeInTheDocument();
  });

  it('deve exibir indicador de carregamento pendente "Carregando atividade..." na página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockReturnValue(pendingPromise),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_123']} />);

    expect(screen.getByText('Carregando atividade...')).toBeInTheDocument();

    resolvePromise({
      id: 'atv_123',
      titulo: 'Atv',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 10,
      encontros: [],
      cargaHorariaMinutos: 60,
      situacao: 'prevista',
      ocupadas: 0,
      vagasRestantes: 10,
      emEspera: 0,
    });
  });

  it('deve exibir todos os campos obrigatórios na página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_completa',
        titulo: 'Flutter Avançado',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 20,
        encontros: [
          { id: 'enc_1', inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
        ],
        cargaHorariaMinutos: 180,
        situacao: 'prevista',
        ocupadas: 12,
        vagasRestantes: 8,
        emEspera: 3,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_completa']} />);

    expect(await screen.findByTestId('detalhe-titulo')).toHaveTextContent('Flutter Avançado');
    expect(screen.getByTestId('detalhe-tipo')).toHaveTextContent('minicurso');
    expect(screen.getByTestId('detalhe-vagas')).toHaveTextContent('20');
    expect(screen.getByTestId('detalhe-carga')).toHaveTextContent('180');
    expect(screen.getByTestId('detalhe-situacao')).toHaveTextContent('prevista');
    expect(screen.getByTestId('detalhe-ocupadas')).toHaveTextContent('12');
    expect(screen.getByTestId('detalhe-vagas-restantes')).toHaveTextContent('8');
    expect(screen.getByTestId('detalhe-em-espera')).toHaveTextContent('3');
  });

  it('deve resolver o nome da sala corretamente na página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'auditorio', nome: 'Auditório Central', capacidade: 200 }]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_sala',
        titulo: 'Palestra Magna',
        tipo: 'palestra',
        salaId: 'auditorio',
        vagas: 200,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 50,
        vagasRestantes: 150,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_sala']} />);

    expect(await screen.findByTestId('detalhe-sala')).toHaveTextContent('Auditório Central');
  });

  it('deve exibir os encontros na ordem recebida da API', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_encontros',
        titulo: 'Minicurso Multi',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 40,
        encontros: [
          { id: 'enc_1', inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' },
          { id: 'enc_2', inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' },
        ],
        cargaHorariaMinutos: 240,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 40,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_encontros']} />);

    expect(await screen.findByText('Minicurso Multi')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it('deve exibir erro contendo código e mensagem da API na página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockRejectedValue({
        erro: 'NAO_ENCONTRADO',
        mensagem: 'Atividade não encontrada',
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_inexistente']} />);

    expect(await screen.findByText(/NAO_ENCONTRADO/)).toBeInTheDocument();
    expect(screen.getByText(/Atividade não encontrada/)).toBeInTheDocument();
  });

  it('deve indicar visualmente atividade cancelada na página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_canc',
        titulo: 'Palestra Cancelada Detalhe',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 40,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'cancelada',
        ocupadas: 0,
        vagasRestantes: 40,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_canc']} />);

    expect(await screen.findByText('Palestra Cancelada Detalhe')).toBeInTheDocument();
    expect(screen.getByText('Atividade Cancelada')).toBeInTheDocument();
  });

  it('o ponto de extensão M2 deve ser completamente invisível', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_m2',
        titulo: 'Atividade M2',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 40,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 40,
        emEspera: 0,
      }),
    };

    const { container } = render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_m2']} />);

    await screen.findByText('Atividade M2');
    expect(container.querySelector('[data-m2]')).toBeNull();
  });

  it('deve permitir retornar para a programação a partir da página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([
        {
          id: 'atv_123',
          titulo: 'Programação Principal',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 40,
          encontros: [],
          cargaHorariaMinutos: 60,
          situacao: 'prevista',
          ocupadas: 0,
          vagasRestantes: 40,
          emEspera: 0,
        },
      ]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_123',
        titulo: 'Programação Principal',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 40,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 40,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_123']} />);

    expect(await screen.findByText('Programação Principal')).toBeInTheDocument();

    const btnVoltar = screen.getByText('Voltar para a programação');
    fireEvent.click(btnVoltar);

    expect(await screen.findByRole('heading', { name: 'Programação' })).toBeInTheDocument();
  });
});
