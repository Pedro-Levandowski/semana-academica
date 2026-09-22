import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { api } from './api/client';

const bloqueio = {
  participanteId: 'p-bloqueado',
  nome: 'Pessoa Bloqueada',
  atividades: ['atv-1', 'atv-2'],
  bloqueadoDesde: '2026-10-22T11:00:00-03:00',
};

function criarClienteFake(sobrescritas: Record<string, unknown> = {}) {
  return {
    ...api,
    getSalas: vi.fn().mockResolvedValue([]),
    getAtividades: vi.fn().mockResolvedValue([]),
    getPainelAtividades: vi.fn().mockResolvedValue([]),
    getBloqueios: vi.fn().mockResolvedValue([]),
    deleteBloqueio: vi.fn().mockResolvedValue(undefined),
    ...sobrescritas,
  };
}

describe('M5 - Bloqueios da organização (Fatia 7)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('cliente lista bloqueios e remove bloqueio aceitando resposta 204 sem JSON', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const jsonGet = vi.fn().mockResolvedValue([bloqueio]);
    const jsonDelete = vi.fn();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: jsonGet })
      .mockResolvedValueOnce({ ok: true, status: 204, json: jsonDelete });
    vi.stubGlobal('fetch', mockFetch);

    await expect((api as any).getBloqueios()).resolves.toEqual([bloqueio]);
    await expect((api as any).deleteBloqueio('p/bloqueado')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/painel/bloqueios',
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Usuario': 'org-ana' }) })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/painel/bloqueios/p%2Fbloqueado',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ 'X-Usuario': 'org-ana' }),
      })
    );
    expect(jsonDelete).not.toHaveBeenCalled();
  });

  it('mostra navegação somente para organização e protege acesso direto do participante', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const org = render(<App apiClient={criarClienteFake() as any} initialEntries={['/']} />);
    expect(await screen.findByRole('link', { name: 'Bloqueios' })).toHaveAttribute(
      'href', '/painel/bloqueios'
    );
    org.unmount();

    localStorage.setItem('selectedUserId', 'p-carla');
    const clienteParticipante = criarClienteFake();
    render(<App apiClient={clienteParticipante as any} initialEntries={['/painel/bloqueios']} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso restrito');
    expect(clienteParticipante.getBloqueios).not.toHaveBeenCalled();
  });

  it('exibe carregamento e depois preserva os bloqueios recebidos da API', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    let resolver!: (valor: typeof bloqueio[]) => void;
    const pendente = new Promise<typeof bloqueio[]>((resolve) => { resolver = resolve; });
    const fakeClient = criarClienteFake({ getBloqueios: vi.fn().mockReturnValue(pendente) });
    render(<App apiClient={fakeClient as any} initialEntries={['/painel/bloqueios']} />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando bloqueios...');
    await act(async () => resolver([bloqueio]));

    const tabela = await screen.findByRole('table', { name: 'Participantes bloqueados' });
    const linha = within(tabela).getByRole('row', { name: /Pessoa Bloqueada/i });
    expect(within(linha).getByText('atv-1, atv-2')).toBeInTheDocument();
    expect(within(linha).getByText('2026-10-22T11:00:00-03:00')).toBeInTheDocument();
  });

  it('exibe estados vazio e erro com atualização manual visível', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const primeira = render(
      <App apiClient={criarClienteFake() as any} initialEntries={['/painel/bloqueios']} />
    );
    expect(await screen.findByText('Nenhum participante bloqueado.')).toHaveAttribute(
      'role', 'status'
    );
    expect(screen.getByRole('button', { name: 'Atualizar bloqueios' })).toBeInTheDocument();
    primeira.unmount();

    const comErro = criarClienteFake({
      getBloqueios: vi.fn().mockRejectedValue({
        erro: 'BLOQUEIOS_INDISPONIVEIS',
        mensagem: 'Não foi possível carregar os bloqueios',
      }),
    });
    render(<App apiClient={comErro as any} initialEntries={['/painel/bloqueios']} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('BLOQUEIOS_INDISPONIVEIS');
    expect(alert).toHaveTextContent('Não foi possível carregar os bloqueios');
  });

  it('atualiza manualmente por teclado', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();
    const getBloqueios = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([bloqueio]);
    const fakeClient = criarClienteFake({ getBloqueios });
    render(<App apiClient={fakeClient as any} initialEntries={['/painel/bloqueios']} />);
    expect(await screen.findByText('Nenhum participante bloqueado.')).toBeInTheDocument();
    const atualizar = screen.getByRole('button', { name: 'Atualizar bloqueios' });
    atualizar.focus();
    expect(atualizar).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(getBloqueios).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('row', { name: /Pessoa Bloqueada/i })).toBeInTheDocument();
  });

  it('bloqueia DELETE duplicado e reconsulta automaticamente após o 204', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();
    const getBloqueios = vi.fn().mockResolvedValueOnce([bloqueio]).mockResolvedValueOnce([]);
    let concluir!: () => void;
    const deleteBloqueio = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => { concluir = resolve; })
    );
    const fakeClient = criarClienteFake({ getBloqueios, deleteBloqueio });
    render(<App apiClient={fakeClient as any} initialEntries={['/painel/bloqueios']} />);

    const desbloquear = await screen.findByRole('button', {
      name: 'Desbloquear Pessoa Bloqueada',
    });
    await user.click(desbloquear);
    expect(desbloquear).toBeDisabled();
    await user.click(desbloquear);
    expect(deleteBloqueio).toHaveBeenCalledTimes(1);

    await act(async () => concluir());
    await waitFor(() => expect(getBloqueios).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Nenhum participante bloqueado.')).toBeInTheDocument();
  });

  it('mantém a linha e reabilita a ação quando o desbloqueio falha', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();
    const fakeClient = criarClienteFake({
      getBloqueios: vi.fn().mockResolvedValue([bloqueio]),
      deleteBloqueio: vi.fn().mockRejectedValue({
        erro: 'DESBLOQUEIO_INDISPONIVEL',
        mensagem: 'Não foi possível desbloquear',
      }),
    });
    render(<App apiClient={fakeClient as any} initialEntries={['/painel/bloqueios']} />);
    const desbloquear = await screen.findByRole('button', {
      name: 'Desbloquear Pessoa Bloqueada',
    });
    await user.click(desbloquear);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('DESBLOQUEIO_INDISPONIVEL');
    expect(alert).toHaveTextContent('Não foi possível desbloquear');
    expect(desbloquear).toBeEnabled();
    expect(screen.getByRole('row', { name: /Pessoa Bloqueada/i })).toBeInTheDocument();
  });
});
