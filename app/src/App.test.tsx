import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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

  it('participante não vê a ação de criação de atividade', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/']} />);

    await screen.findByText(/Nenhuma atividade encontrada/i);
    expect(screen.queryByText('Criar atividade')).not.toBeInTheDocument();
  });

  it('organização visualiza a ação de criação de atividade', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/']} />);

    expect(await screen.findByText('Criar atividade')).toBeInTheDocument();
  });

  it('navegação para o formulário ao clicar na ação de criação', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/']} />);

    const linkCriar = await screen.findByText('Criar atividade');
    fireEvent.click(linkCriar);

    expect(await screen.findByRole('heading', { name: 'Criar Atividade' })).toBeInTheDocument();
  });

  it('o formulário possui campos e rótulos acessíveis para título, tipo, sala, vagas e encontros', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    expect(await screen.findByLabelText('Título:')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo:')).toBeInTheDocument();
    expect(screen.getByLabelText('Sala:')).toBeInTheDocument();
    expect(screen.getByLabelText('Vagas:')).toBeInTheDocument();
    expect(screen.getByLabelText('Início:')).toBeInTheDocument();
    expect(screen.getByLabelText('Fim:')).toBeInTheDocument();
  });

  it('as salas do formulário são provenientes do cliente falso', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    expect(await screen.findByText('Laboratório 3 (Capacidade: 20)')).toBeInTheDocument();
  });

  it('permite adicionar e remover encontros dinamicamente', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    await screen.findByLabelText('Título:');

    const btnAdd = screen.getByText('Adicionar Encontro');
    fireEvent.click(btnAdd);

    const inicioInputs = screen.getAllByLabelText('Início:');
    expect(inicioInputs.length).toBe(2);

    const btnRemove = screen.getAllByText('Remover')[0];
    fireEvent.click(btnRemove);

    expect(screen.getAllByLabelText('Início:').length).toBe(1);
  });

  it('envia o payload conforme o contrato, incluindo conversão de datas datetime-local para ISO 8601 com -03:00', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const createMock = vi.fn().mockResolvedValue({ id: 'atv_new', titulo: 'Teste Payload' });
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      createAtividade: createMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    fireEvent.change(await screen.findByLabelText('Título:'), { target: { value: 'Teste Payload' } });
    fireEvent.change(screen.getByLabelText('Vagas:'), { target: { value: '30' } });
    fireEvent.change(screen.getAllByLabelText('Início:')[0], { target: { value: '2026-10-19T10:00' } });
    fireEvent.change(screen.getAllByLabelText('Fim:')[0], { target: { value: '2026-10-19T12:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Atividade' }));

    expect(createMock).toHaveBeenCalledWith({
      titulo: 'Teste Payload',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 30,
      encontros: [
        {
          inicio: '2026-10-19T10:00:00-03:00',
          fim: '2026-10-19T12:00:00-03:00',
        },
      ],
    });
  });

  it('bloqueia o botão e impede envio duplicado durante promessa pendente', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const createMock = vi.fn().mockReturnValue(pendingPromise);
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      createAtividade: createMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    fireEvent.change(await screen.findByLabelText('Título:'), { target: { value: 'Duplicado' } });
    fireEvent.change(screen.getAllByLabelText('Início:')[0], { target: { value: '2026-10-19T10:00' } });
    fireEvent.change(screen.getAllByLabelText('Fim:')[0], { target: { value: '2026-10-19T12:00' } });

    const submitBtn = screen.getByRole('button', { name: 'Salvar Atividade' });
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Criando atividade...' })).toBeDisabled();

    resolvePromise({ id: 'atv_1', titulo: 'Duplicado' });
  });

  it('exibe erro com código e mensagem da API e reabilita o formulário após falha', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      createAtividade: vi.fn().mockRejectedValue({
        erro: 'VAGAS_ACIMA_DA_CAPACIDADE',
        mensagem: 'Vagas acima da capacidade permitida',
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    fireEvent.change(await screen.findByLabelText('Título:'), { target: { value: 'Erro' } });
    fireEvent.change(screen.getAllByLabelText('Início:')[0], { target: { value: '2026-10-19T10:00' } });
    fireEvent.change(screen.getAllByLabelText('Fim:')[0], { target: { value: '2026-10-19T12:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Atividade' }));

    expect(await screen.findByText(/VAGAS_ACIMA_DA_CAPACIDADE/)).toBeInTheDocument();
    expect(screen.getByText(/Vagas acima da capacidade permitida/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar Atividade' })).not.toBeDisabled();
  });

  it('exibe confirmação de sucesso e navega para o detalhe da atividade criada', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      createAtividade: vi.fn().mockResolvedValue({
        id: 'atv_created',
        titulo: 'Sucesso Total',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_created',
        titulo: 'Sucesso Total',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    fireEvent.change(await screen.findByLabelText('Título:'), { target: { value: 'Sucesso Total' } });
    fireEvent.change(screen.getAllByLabelText('Início:')[0], { target: { value: '2026-10-19T10:00' } });
    fireEvent.change(screen.getAllByLabelText('Fim:')[0], { target: { value: '2026-10-19T12:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Atividade' }));

    expect(await screen.findByText('Atividade criada com sucesso!')).toBeInTheDocument();
    expect(await screen.findByText('Sucesso Total')).toBeInTheDocument();
  });

  it('participante não vê "Editar atividade" na página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atividade Teste',
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

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    expect(await screen.findByText('Atividade Teste')).toBeInTheDocument();
    expect(screen.queryByText('Editar atividade')).not.toBeInTheDocument();
  });

  it('organização vê a ação "Editar atividade" e navega para a rota correta', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atividade Org',
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

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    const btnEditar = await screen.findByText('Editar atividade');
    fireEvent.click(btnEditar);

    expect(await screen.findByRole('heading', { name: 'Editar Atividade' })).toBeInTheDocument();
  });

  it('carregamento dos dados atuais na página de edição', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockReturnValue(pendingPromise),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    expect(screen.getByText('Carregando atividade...')).toBeInTheDocument();

    resolvePromise({
      id: 'atv_1',
      titulo: 'Atividade',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 40,
      encontros: [],
      cargaHorariaMinutos: 60,
      situacao: 'prevista',
      ocupadas: 0,
      vagasRestantes: 40,
      emEspera: 0,
    });
  });

  it('formulário de edição preenchido com título e vagas existentes', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Flutter Summit',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 35,
        encontros: [],
        cargaHorariaMinutos: 120,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 35,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    const inputTitulo = await screen.findByLabelText('Título:') as HTMLInputElement;
    const inputVagas = screen.getByLabelText('Vagas:') as HTMLInputElement;

    expect(inputTitulo.value).toBe('Flutter Summit');
    expect(inputVagas.value).toBe('35');
  });

  it('ausência de controles editáveis para tipo, sala, encontros e carga horária', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Flutter Summit',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 35,
        encontros: [],
        cargaHorariaMinutos: 120,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 35,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    await screen.findByLabelText('Título:');

    expect(screen.queryByLabelText('Tipo:')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Sala:')).not.toBeInTheDocument();
    expect(screen.getByText('minicurso')).toBeInTheDocument();
    expect(screen.getByText('Sala 101')).toBeInTheDocument();
    expect(screen.getByText('120 minutos')).toBeInTheDocument();
  });

  it('envia payload contendo exclusivamente título e vagas via PATCH /atividades/:id', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const updateMock = vi.fn().mockResolvedValue({ id: 'atv_1', titulo: 'Novo Título' });
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Antigo',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
      updateAtividade: updateMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    const inputTitulo = await screen.findByLabelText('Título:');
    fireEvent.change(inputTitulo, { target: { value: 'Novo Título' } });

    const inputVagas = screen.getByLabelText('Vagas:');
    fireEvent.change(inputVagas, { target: { value: '25' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    expect(updateMock).toHaveBeenCalledWith('atv_1', {
      titulo: 'Novo Título',
      vagas: 25,
    });
  });

  it('bloqueia o botão durante promessa pendente e impede envio duplicado', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const updateMock = vi.fn().mockReturnValue(pendingPromise);
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
      updateAtividade: updateMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    const submitBtn = await screen.findByRole('button', { name: 'Salvar Alterações' });
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();

    resolvePromise({ id: 'atv_1', titulo: 'Atv' });
  });

  it('exibe erro com código/mensagem da API e reabilita o formulário após falha', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
      updateAtividade: vi.fn().mockRejectedValue({
        erro: 'CAMPO_NAO_EDITAVEL',
        mensagem: 'Campo não editável',
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    const submitBtn = await screen.findByRole('button', { name: 'Salvar Alterações' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/CAMPO_NAO_EDITAVEL/)).toBeInTheDocument();
    expect(screen.getByText(/Campo não editável/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).not.toBeDisabled();
  });

  it('exibe sucesso com confirmação e redireciona para o detalhe atualizado', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Editada Sucesso',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
      updateAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Editada Sucesso',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    const submitBtn = await screen.findByRole('button', { name: 'Salvar Alterações' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Atividade alterada com sucesso!')).toBeInTheDocument();
    expect(await screen.findByTestId('detalhe-titulo')).toHaveTextContent('Editada Sucesso');
  });

  it('voltar sem salvar não executa PATCH e retorna ao detalhe', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const updateMock = vi.fn();
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Original',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 20,
        emEspera: 0,
      }),
      updateAtividade: updateMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1/editar']} />);

    const btnVoltar = await screen.findByText('Voltar sem salvar');
    fireEvent.click(btnVoltar);

    expect(updateMock).not.toHaveBeenCalled();
    expect(await screen.findByTestId('detalhe-titulo')).toHaveTextContent('Original');
  });

  it('participante não vê a ação de cancelamento na página de detalhes', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv Part',
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

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    expect(await screen.findByText('Atv Part')).toBeInTheDocument();
    expect(screen.queryByText('Cancelar atividade')).not.toBeInTheDocument();
  });

  it('organização vê a ação de cancelamento quando a atividade não está cancelada', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv Org',
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

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    expect(await screen.findByText('Cancelar atividade')).toBeInTheDocument();
  });

  it('atividade já cancelada não mostra edição nem cancelamento', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv Cancelada',
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

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    expect(await screen.findByText('Atv Cancelada')).toBeInTheDocument();
    expect(screen.queryByText('Editar atividade')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelar atividade')).not.toBeInTheDocument();
  });

  it('abrir confirmação de cancelamento não chama a API', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const cancelMock = vi.fn();
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv',
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
      cancelAtividade: cancelMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    const btnCancelar = await screen.findByText('Cancelar atividade');
    fireEvent.click(btnCancelar);

    expect(cancelMock).not.toHaveBeenCalled();
    expect(screen.getByText('Confirmar cancelamento')).toBeInTheDocument();
    expect(screen.getByText('Manter atividade')).toBeInTheDocument();
  });

  it('desistir do cancelamento fecha a confirmação sem chamada à API', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const cancelMock = vi.fn();
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv',
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
      cancelAtividade: cancelMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    const btnCancelar = await screen.findByText('Cancelar atividade');
    fireEvent.click(btnCancelar);

    const btnManter = screen.getByText('Manter atividade');
    fireEvent.click(btnManter);

    expect(cancelMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Confirmar cancelamento')).not.toBeInTheDocument();
  });

  it('confirmar o cancelamento envia o ID correto para a API', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const cancelMock = vi.fn().mockResolvedValue({
      id: 'atv_target',
      situacao: 'cancelada',
    });
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_target',
        titulo: 'Atv',
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
      cancelAtividade: cancelMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_target']} />);

    const btnCancelar = await screen.findByText('Cancelar atividade');
    fireEvent.click(btnCancelar);

    const btnConfirmar = screen.getByText('Confirmar cancelamento');
    fireEvent.click(btnConfirmar);

    expect(cancelMock).toHaveBeenCalledWith('atv_target');
  });

  it('promessa pendente bloqueia duplicação de chamadas de cancelamento', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const cancelMock = vi.fn().mockReturnValue(pendingPromise);
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv',
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
      cancelAtividade: cancelMock,
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    const btnCancelar = await screen.findByText('Cancelar atividade');
    fireEvent.click(btnCancelar);

    const btnConfirmar = screen.getByText('Confirmar cancelamento');
    fireEvent.click(btnConfirmar);
    fireEvent.click(btnConfirmar);

    expect(cancelMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Cancelando atividade...')).toBeDisabled();

    resolvePromise({ id: 'atv_1', situacao: 'cancelada' });
  });

  it('erro no cancelamento mostra código e mensagem e reabilita controles', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv',
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
      cancelAtividade: vi.fn().mockRejectedValue({
        erro: 'ATIVIDADE_JA_INICIADA',
        mensagem: 'Atividade já iniciada',
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    const btnCancelar = await screen.findByText('Cancelar atividade');
    fireEvent.click(btnCancelar);

    const btnConfirmar = screen.getByText('Confirmar cancelamento');
    fireEvent.click(btnConfirmar);

    expect(await screen.findByText(/ATIVIDADE_JA_INICIADA/)).toBeInTheDocument();
    expect(screen.getByText(/Atividade já iniciada/)).toBeInTheDocument();
    expect(screen.getByText('Confirmar cancelamento')).not.toBeDisabled();
  });

  it('sucesso atualiza o detalhe para cancelada e remove controles administrativos', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValueOnce({
        id: 'atv_1',
        titulo: 'Atv',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 40,
        encontros: [],
        cargaHorariaMinutos: 60,
        situacao: 'prevista',
        ocupadas: 0,
        vagasRestantes: 40,
        emEspera: 0,
      }).mockResolvedValueOnce({
        id: 'atv_1',
        titulo: 'Atv',
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
      cancelAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv',
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

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    const btnCancelar = await screen.findByText('Cancelar atividade');
    fireEvent.click(btnCancelar);

    const btnConfirmar = screen.getByText('Confirmar cancelamento');
    fireEvent.click(btnConfirmar);

    expect(await screen.findByText('Atividade cancelada com sucesso!')).toBeInTheDocument();
    expect(screen.queryByText('Editar atividade')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelar atividade')).not.toBeInTheDocument();
  });

  it('aplicação inicia sem roteadores aninhados quando montada dentro de um BrowserRouter', () => {
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
    };
    render(
      <BrowserRouter>
        <App apiClient={fakeClient} />
      </BrowserRouter>
    );
    expect(screen.getByRole('heading', { name: 'Semana Acadêmica' })).toBeInTheDocument();
  });

  it('formata datas independentemente do fuso da máquina usando America/Sao_Paulo', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]),
      getAtividades: vi.fn().mockResolvedValue([
        {
          id: 'atv_tz',
          titulo: 'Teste Timezone',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 40,
          encontros: [
            { id: 'enc_1', inicio: '2026-10-19T22:00:00Z', fim: '2026-10-19T23:00:00Z' },
          ],
          cargaHorariaMinutos: 60,
          situacao: 'prevista',
          ocupadas: 0,
          vagasRestantes: 40,
          emEspera: 0,
        },
      ]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/']} />);

    expect(await screen.findByText('19:00')).toBeInTheDocument();
  });

  it('trata erro de carregamento de salas na criação impedindo submissão e exibindo erro acessível com role="alert"', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockRejectedValue({
        erro: 'ERRO_SALAS',
        mensagem: 'Falha ao carregar salas',
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/atividades/nova']} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro (ERRO_SALAS): Falha ao carregar salas');
  });

  it('utiliza papéis acessíveis (role="status" e role="alertdialog") para estados e confirmação de cancelamento', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividade: vi.fn().mockResolvedValue({
        id: 'atv_1',
        titulo: 'Atv Role Test',
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

    render(<App apiClient={fakeClient} initialEntries={['/atividades/atv_1']} />);

    const btnCancelar = await screen.findByText('Cancelar atividade');
    fireEvent.click(btnCancelar);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
