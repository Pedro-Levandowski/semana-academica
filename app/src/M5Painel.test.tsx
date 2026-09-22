import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { api } from './api/client';

describe('M5 - Painel (Fatia 6)', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => store.get(key) || null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value));
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(() => {
        store.clear();
      }),
      key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
      get length() {
        return store.size;
      },
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    vi.restoreAllMocks();
  });

  it('navegação exclusiva da organização', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
      getPainelAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} />);

    const linkPainel = await screen.findByRole('link', { name: /Painel da organização/i });
    expect(linkPainel).toBeInTheDocument();

    await userEvent.click(linkPainel);

    expect(await screen.findByRole('heading', { name: /Painel da organização/i })).toBeInTheDocument();
    expect(fakeClient.getPainelAtividades).toHaveBeenCalledTimes(1);
  });

  it('participante sem acesso visual ou direto', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
      getPainelAtividades: vi.fn().mockResolvedValue([]),
    };

    const { unmount } = render(<App apiClient={fakeClient} initialEntries={['/']} />);

    expect(screen.queryByRole('link', { name: /Painel da organização/i })).not.toBeInTheDocument();
    unmount();

    render(<App apiClient={fakeClient} initialEntries={['/painel']} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Acesso restrito/i);
    expect(fakeClient.getPainelAtividades).not.toHaveBeenCalled();
  });

  it('carregamento', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
      getPainelAtividades: vi.fn().mockReturnValue(pendingPromise),
    };

    render(<App apiClient={fakeClient} initialEntries={['/painel']} />);

    expect(screen.getByRole('status')).toHaveTextContent(/Carregando painel.../i);

    await act(async () => {
      resolvePromise([]);
    });
  });

  it('sucesso e API como fonte da verdade', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
      getPainelAtividades: vi.fn().mockResolvedValue([
        {
          atividadeId: 'atv-painel-1',
          titulo: 'Flutter do zero',
          vagas: 3,
          ocupadas: 2,
          emEspera: 1,
          ocupacaoPercentual: 66.7,
          frequenciaPercentual: null,
        },
        {
          atividadeId: 'atv-painel-2',
          titulo: 'React avançado',
          vagas: 20,
          ocupadas: 20,
          emEspera: 0,
          ocupacaoPercentual: 100,
          frequenciaPercentual: 75,
        },
      ]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/painel']} />);

    const table = await screen.findByRole('table', { name: /Atividades do painel/i });
    
    const headers = [
      'Atividade',
      'Vagas',
      'Ocupadas',
      'Em espera',
      'Ocupação',
      'Frequência',
    ];
    headers.forEach((header) => {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    });

    const rowFlutter = screen.getByRole('row', { name: /Flutter do zero/i });
    const utilsFlutter = within(rowFlutter);
    expect(utilsFlutter.getByText('3')).toBeInTheDocument();
    expect(utilsFlutter.getByText('2')).toBeInTheDocument();
    expect(utilsFlutter.getByText('1')).toBeInTheDocument();
    expect(utilsFlutter.getByText('66,7%')).toBeInTheDocument();
    expect(utilsFlutter.getByText(/Não disponível/i)).toBeInTheDocument();

    const rowReact = screen.getByRole('row', { name: /React avançado/i });
    const utilsReact = within(rowReact);
    expect(utilsReact.getAllByText('20')).toHaveLength(2);
    expect(utilsReact.getByText('0')).toBeInTheDocument();
    expect(utilsReact.getByText('100,0%')).toBeInTheDocument();
    expect(utilsReact.getByText('75,0%')).toBeInTheDocument();
  });

  it('exibe estado vazio distinto quando a API não retorna atividades', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');

    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
      getPainelAtividades: vi.fn().mockResolvedValue([]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/painel']} />);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Nenhuma atividade encontrada no painel.'
      );
    });

    expect(
      screen.queryByRole('table', { name: /Atividades do painel/i })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Atualizar painel' })
    ).toBeInTheDocument();
  });

  it('exibe código e mensagem devolvidos pela API em estado de erro acessível', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');

    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
      getPainelAtividades: vi.fn().mockRejectedValue({
        erro: 'PAINEL_INDISPONIVEL',
        mensagem: 'Não foi possível carregar o painel',
      }),
    };

    render(<App apiClient={fakeClient} initialEntries={['/painel']} />);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('PAINEL_INDISPONIVEL');
    expect(alert).toHaveTextContent('Não foi possível carregar o painel');

    expect(
      screen.getByRole('button', { name: 'Atualizar painel' })
    ).toBeInTheDocument();
  });

  it('atualiza manualmente por teclado e reflete somente os novos dados da API', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();

    const fakeClient = {
      ...api,
      getSalas: vi.fn().mockResolvedValue([]),
      getAtividades: vi.fn().mockResolvedValue([]),
      getPainelAtividades: vi.fn()
        .mockResolvedValueOnce([
          {
            atividadeId: 'atv-relogio',
            titulo: 'Atividade controlada pela API',
            vagas: 10,
            ocupadas: 5,
            emEspera: 0,
            ocupacaoPercentual: 50,
            frequenciaPercentual: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            atividadeId: 'atv-relogio',
            titulo: 'Atividade controlada pela API',
            vagas: 10,
            ocupadas: 5,
            emEspera: 0,
            ocupacaoPercentual: 50,
            frequenciaPercentual: 75,
          },
        ]),
    };

    render(<App apiClient={fakeClient} initialEntries={['/painel']} />);

    expect(await screen.findByText('Não disponível')).toBeInTheDocument();
    expect(fakeClient.getPainelAtividades).toHaveBeenCalledTimes(1);

    const atualizar = screen.getByRole('button', {
      name: 'Atualizar painel',
    });

    atualizar.focus();
    expect(atualizar).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(fakeClient.getPainelAtividades).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText('75,0%')).toBeInTheDocument();
    expect(screen.queryByText('Não disponível')).not.toBeInTheDocument();
  });
});
