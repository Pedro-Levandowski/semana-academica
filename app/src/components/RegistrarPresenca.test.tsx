import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrarPresenca } from './RegistrarPresenca';
import { api } from '../api/client';
import { ApiError } from '../api/types';

describe('RegistrarPresenca Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve registrar presença com sucesso 201 e limpar o campo', async () => {
    const registrarPresencaMock = vi.fn().mockResolvedValue({
      presenca: {
        id: 'pre_1',
        encontroId: 'enc_1',
        participanteId: 'p-carla',
        origem: 'qr',
        lidoEm: '2026-10-19T10:00:00-03:00',
        registradaEm: '2026-10-19T10:00:01-03:00',
        justificativa: null,
      },
      status: 201,
    });

    const fakeClient = {
      ...api,
      registrarPresenca: registrarPresencaMock,
    };

    render(<RegistrarPresenca encontroId="enc_1" apiClient={fakeClient} />);

    const input = screen.getByTestId('codigo-input');
    const submitBtn = screen.getByTestId('submit-button');

    await userEvent.type(input, 'K7M2QX');
    expect(input).toHaveValue('K7M2QX');

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toHaveTextContent('Presença registrada agora.');
    });

    expect(registrarPresencaMock).toHaveBeenCalledWith('enc_1', { codigo: 'K7M2QX' });
    expect(input).toHaveValue('');
  });

  it('deve lidar com sucesso 200 (idempotência - presença já existia) e limpar o campo', async () => {
    const registrarPresencaMock = vi.fn().mockResolvedValue({
      presenca: {
        id: 'pre_1',
        encontroId: 'enc_1',
        participanteId: 'p-carla',
        origem: 'qr',
        lidoEm: '2026-10-19T10:00:00-03:00',
        registradaEm: '2026-10-19T10:00:01-03:00',
        justificativa: null,
      },
      status: 200,
    });

    const fakeClient = {
      ...api,
      registrarPresenca: registrarPresencaMock,
    };

    render(<RegistrarPresenca encontroId="enc_1" apiClient={fakeClient} />);

    const input = screen.getByTestId('codigo-input');
    await userEvent.type(input, 'K7M2QX');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toHaveTextContent('Presença já estava registrada.');
    });

    expect(input).toHaveValue('');
  });

  it('deve tratar erro NAO_INSCRITO e limpar o campo', async () => {
    const registrarPresencaMock = vi.fn().mockRejectedValue(
      new ApiError(403, 'NAO_INSCRITO', 'Participante não inscrito nesta atividade.')
    );

    const fakeClient = {
      ...api,
      registrarPresenca: registrarPresencaMock,
    };

    render(<RegistrarPresenca encontroId="enc_1" apiClient={fakeClient} />);

    const input = screen.getByTestId('codigo-input');
    await userEvent.type(input, 'K7M2QX');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('NAO_INSCRITO');
      expect(errorEl).toHaveTextContent('Participante não elegível.');
    });

    expect(input).toHaveValue('');
  });

  it('deve tratar erro CODIGO_INVALIDO e limpar o campo', async () => {
    const registrarPresencaMock = vi.fn().mockRejectedValue(
      new ApiError(422, 'CODIGO_INVALIDO', 'Código incorreto.')
    );

    const fakeClient = {
      ...api,
      registrarPresenca: registrarPresencaMock,
    };

    render(<RegistrarPresenca encontroId="enc_1" apiClient={fakeClient} />);

    const input = screen.getByTestId('codigo-input');
    await userEvent.type(input, 'WRONG1');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('CODIGO_INVALIDO');
      expect(errorEl).toHaveTextContent('Código inválido.');
    });

    expect(input).toHaveValue('');
  });

  it('deve tratar erro FORA_DA_JANELA e limpar o campo', async () => {
    const registrarPresencaMock = vi.fn().mockRejectedValue(
      new ApiError(422, 'FORA_DA_JANELA', 'Fora do horário.')
    );

    const fakeClient = {
      ...api,
      registrarPresenca: registrarPresencaMock,
    };

    render(<RegistrarPresenca encontroId="enc_1" apiClient={fakeClient} />);

    const input = screen.getByTestId('codigo-input');
    await userEvent.type(input, 'K7M2QX');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('FORA_DA_JANELA');
      expect(errorEl).toHaveTextContent('Fora do horário permitido.');
    });

    expect(input).toHaveValue('');
  });

  it('deve tratar erro de rede / sem conexão e limpar o campo', async () => {
    const registrarPresencaMock = vi.fn().mockRejectedValue(
      new Error('Failed to fetch')
    );

    const fakeClient = {
      ...api,
      registrarPresenca: registrarPresencaMock,
    };

    render(<RegistrarPresenca encontroId="enc_1" apiClient={fakeClient} />);

    const input = screen.getByTestId('codigo-input');
    await userEvent.type(input, 'K7M2QX');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('ERRO_REDE');
      expect(errorEl).toHaveTextContent('Sem conexão / Erro de rede');
    });

    expect(input).toHaveValue('');
  });
});
