import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { api } from './api/client';

const atividadePainel = {
  atividadeId: 'atv-critica',
  titulo: 'Atividade crítica',
  vagas: 10,
  ocupadas: 4,
  emEspera: 0,
  ocupacaoPercentual: 40,
  frequenciaPercentual: 50,
};

function criarClienteFake(sobrescritas: Record<string, unknown> = {}) {
  return {
    ...api,
    getSalas: vi.fn().mockResolvedValue([]),
    getAtividades: vi.fn().mockResolvedValue([]),
    getPainelAtividades: vi.fn().mockResolvedValue([atividadePainel]),
    getSemChance: vi.fn().mockResolvedValue([]),
    ...sobrescritas,
  };
}

describe('M5 - Sem chance de certificado (Fatia 7)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('oferece navegação para o relatório a partir de cada atividade do painel', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = criarClienteFake();

    render(<App apiClient={fakeClient} initialEntries={['/painel']} />);

    const link = await screen.findByRole('link', {
      name: 'Ver sem chance de certificado de Atividade crítica',
    });

    expect(link).toHaveAttribute(
      'href',
      '/painel/atividades/atv-critica/sem-chance'
    );
  });

  it('exibe carregamento enquanto o relatório sem chance está pendente', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    let resolver: (value: unknown[]) => void = () => undefined;
    const pendente = new Promise<unknown[]>((resolve) => {
      resolver = resolve;
    });
    const fakeClient = criarClienteFake({
      getSemChance: vi.fn().mockReturnValue(pendente),
    });

    render(
      <App
        apiClient={fakeClient}
        initialEntries={['/painel/atividades/atv-critica/sem-chance']}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Carregando relatório...');
    resolver([]);
    expect(
      await screen.findByText('Nenhum participante sem chance de certificado.')
    ).toBeInTheDocument();
  });

  it('exibe os participantes e valores retornados pela API sem recalcular faltas', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');

    const fakeClient = criarClienteFake({
      getSemChance: vi.fn().mockResolvedValue([
        {
          participanteId: 'p-ana',
          nome: 'Ana Lima',
          faltas: 2,
          faltasPermitidas: 1,
        },
        {
          participanteId: 'p-bruno',
          nome: 'Bruno Souza',
          faltas: 4,
          faltasPermitidas: 3,
        },
      ]),
    });

    render(
      <App
        apiClient={fakeClient}
        initialEntries={['/painel/atividades/atv-critica/sem-chance']}
      />
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Participantes sem chance de certificado',
      })
    ).toBeInTheDocument();

    const tabela = await screen.findByRole('table', {
      name: 'Participantes sem chance',
    });

    expect(
      within(tabela).getByRole('columnheader', { name: 'Participante' })
    ).toBeInTheDocument();
    expect(
      within(tabela).getByRole('columnheader', { name: 'Faltas' })
    ).toBeInTheDocument();
    expect(
      within(tabela).getByRole('columnheader', {
        name: 'Faltas permitidas',
      })
    ).toBeInTheDocument();

    const ana = within(tabela).getByRole('row', { name: /Ana Lima/i });
    expect(within(ana).getByText('2')).toBeInTheDocument();
    expect(within(ana).getByText('1')).toBeInTheDocument();

    const bruno = within(tabela).getByRole('row', { name: /Bruno Souza/i });
    expect(within(bruno).getByText('4')).toBeInTheDocument();
    expect(within(bruno).getByText('3')).toBeInTheDocument();

    expect(fakeClient.getSemChance).toHaveBeenCalledTimes(1);
    expect(fakeClient.getSemChance).toHaveBeenCalledWith('atv-critica');
  });

  it('exibe estado vazio distinto e atualização manual visível', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const fakeClient = criarClienteFake();

    render(
      <App
        apiClient={fakeClient}
        initialEntries={['/painel/atividades/atv-critica/sem-chance']}
      />
    );

    expect(
      await screen.findByText(
        'Nenhum participante sem chance de certificado.'
      )
    ).toHaveAttribute('role', 'status');

    expect(
      screen.queryByRole('table', { name: 'Participantes sem chance' })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Atualizar relatório' })
    ).toBeInTheDocument();
  });

  it('exibe código e mensagem de erro da API em elemento acessível', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');

    const fakeClient = criarClienteFake({
      getSemChance: vi.fn().mockRejectedValue({
        erro: 'RELATORIO_INDISPONIVEL',
        mensagem: 'Não foi possível carregar o relatório',
      }),
    });

    render(
      <App
        apiClient={fakeClient}
        initialEntries={['/painel/atividades/atv-critica/sem-chance']}
      />
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('RELATORIO_INDISPONIVEL');
    expect(alert).toHaveTextContent(
      'Não foi possível carregar o relatório'
    );

    expect(
      screen.getByRole('button', { name: 'Atualizar relatório' })
    ).toBeInTheDocument();
  });

  it('atualiza o relatório por teclado e reflete a nova resposta da API', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();

    const getSemChance = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          participanteId: 'p-nova',
          nome: 'Nova Participante',
          faltas: 3,
          faltasPermitidas: 1,
        },
      ]);

    const fakeClient = criarClienteFake({ getSemChance });

    render(
      <App
        apiClient={fakeClient}
        initialEntries={['/painel/atividades/atv-critica/sem-chance']}
      />
    );

    expect(
      await screen.findByText(
        'Nenhum participante sem chance de certificado.'
      )
    ).toBeInTheDocument();

    const atualizar = screen.getByRole('button', {
      name: 'Atualizar relatório',
    });

    atualizar.focus();
    expect(atualizar).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(getSemChance).toHaveBeenCalledTimes(2);
    });

    expect(
      await screen.findByRole('row', { name: /Nova Participante/i })
    ).toBeInTheDocument();
  });

  it('impede acesso direto de participante sem consultar o relatório', async () => {
    localStorage.setItem('selectedUserId', 'p-carla');
    const fakeClient = criarClienteFake();

    render(
      <App
        apiClient={fakeClient}
        initialEntries={['/painel/atividades/atv-critica/sem-chance']}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Acesso restrito'
    );
    expect(fakeClient.getSemChance).not.toHaveBeenCalled();
  });
});
