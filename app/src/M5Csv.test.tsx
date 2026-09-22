import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { api } from './api/client';

const atividadePainel = {
  atividadeId: 'atv-csv',
  titulo: 'Atividade CSV',
  vagas: 10,
  ocupadas: 4,
  emEspera: 1,
  ocupacaoPercentual: 40,
  frequenciaPercentual: 75,
};

function criarClienteFake(sobrescritas: Record<string, unknown> = {}) {
  return {
    ...api,
    getSalas: vi.fn().mockResolvedValue([]),
    getAtividades: vi.fn().mockResolvedValue([]),
    getPainelAtividades: vi.fn().mockResolvedValue([atividadePainel]),
    downloadFrequenciaCsv: vi.fn(),
    ...sobrescritas,
  };
}

function lerBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

describe('M5 - Download de frequência CSV (Fatia 7)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('cliente preserva exatamente os bytes e metadados devolvidos pela API', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const bytesEsperados = new Uint8Array([
      0xef, 0xbb, 0xbf, 0x6e, 0x6f, 0x6d, 0x65, 0x3b, 0x45, 0x31, 0x0a,
    ]);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (nome: string) => ({
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="frequencia.csv"',
        })[nome.toLowerCase()] ?? null,
      },
      arrayBuffer: async () => bytesEsperados.buffer.slice(0),
    });
    vi.stubGlobal('fetch', mockFetch);

    const arquivo = await (api as any).downloadFrequenciaCsv('atv/csv');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/painel/atividades/atv%2Fcsv/frequencia.csv',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Usuario': 'org-ana' }),
      })
    );
    expect(arquivo.nomeArquivo).toBe('frequencia.csv');
    expect(arquivo.contentType).toBe('text/csv; charset=utf-8');
    expect(await lerBytes(arquivo.blob)).toEqual(bytesEsperados);
  });

  it('oferece download por atividade sem modificar o Blob recebido', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x0a])], {
      type: 'text/csv; charset=utf-8',
    });
    const downloadFrequenciaCsv = vi.fn().mockResolvedValue({
      blob,
      nomeArquivo: 'frequencia.csv',
      contentType: 'text/csv; charset=utf-8',
    });
    const fakeClient = criarClienteFake({ downloadFrequenciaCsv });
    const createObjectURL = vi.fn().mockReturnValue('blob:frequencia');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const clickDoLink = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<App apiClient={fakeClient as any} initialEntries={['/painel']} />);
    const baixar = await screen.findByRole('button', {
      name: 'Baixar frequência de Atividade CSV',
    });
    await user.click(baixar);

    await waitFor(() => expect(downloadFrequenciaCsv).toHaveBeenCalledTimes(1));
    expect(downloadFrequenciaCsv).toHaveBeenCalledWith('atv-csv');
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickDoLink).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:frequencia');
  });

  it('bloqueia acionamento duplicado enquanto o download está em andamento', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();
    let resolver!: (arquivo: { blob: Blob; nomeArquivo: string; contentType: string }) => void;
    const pendente = new Promise<{ blob: Blob; nomeArquivo: string; contentType: string }>(
      (resolve) => { resolver = resolve; }
    );
    const downloadFrequenciaCsv = vi.fn().mockReturnValue(pendente);
    const fakeClient = criarClienteFake({ downloadFrequenciaCsv });
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn().mockReturnValue('blob:pendente'), configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<App apiClient={fakeClient as any} initialEntries={['/painel']} />);
    const baixar = await screen.findByRole('button', {
      name: 'Baixar frequência de Atividade CSV',
    });
    await user.click(baixar);

    expect(baixar).toBeDisabled();
    expect(downloadFrequenciaCsv).toHaveBeenCalledTimes(1);
    await user.click(baixar);
    expect(downloadFrequenciaCsv).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolver({
        blob: new Blob(['csv']),
        nomeArquivo: 'frequencia.csv',
        contentType: 'text/csv; charset=utf-8',
      });
    });
    await waitFor(() => expect(baixar).not.toBeDisabled());
  });

  it('exibe código e mensagem quando a exportação falha', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const user = userEvent.setup();
    const fakeClient = criarClienteFake({
      downloadFrequenciaCsv: vi.fn().mockRejectedValue({
        erro: 'EXPORTACAO_INDISPONIVEL',
        mensagem: 'Não foi possível exportar a frequência',
      }),
    });

    render(<App apiClient={fakeClient as any} initialEntries={['/painel']} />);
    const baixar = await screen.findByRole('button', {
      name: 'Baixar frequência de Atividade CSV',
    });
    await user.click(baixar);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('EXPORTACAO_INDISPONIVEL');
    expect(alert).toHaveTextContent('Não foi possível exportar a frequência');
  });
});
