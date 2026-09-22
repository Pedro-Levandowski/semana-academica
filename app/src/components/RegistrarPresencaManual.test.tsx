import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrarPresencaManual } from './RegistrarPresencaManual';
import { api } from '../api/client';
import { ApiError } from '../api/types';

describe('RegistrarPresencaManual Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('deve registrar presença manual com sucesso 201 e limpar os campos', async () => {
    const registrarPresencaManualMock = vi.fn().mockResolvedValue({
      presenca: {
        id: 'pre_1',
        encontroId: 'enc_1',
        participanteId: 'p-carla',
        origem: 'manual',
        lidoEm: null,
        registradaEm: '2026-10-19T10:00:01-03:00',
        justificativa: 'Participante chegou atrasado por motivo de força maior.',
      },
      status: 201,
    });

    const fakeClient = {
      ...api,
      registrarPresencaManual: registrarPresencaManualMock,
    };

    render(<RegistrarPresencaManual encontroId="enc_1" apiClient={fakeClient} />);

    const participanteInput = screen.getByTestId('participante-id-input');
    const justificativaInput = screen.getByTestId('justificativa-input');
    const submitBtn = screen.getByTestId('submit-button');

    await userEvent.type(participanteInput, 'p-carla');
    await userEvent.type(justificativaInput, 'Participante chegou atrasado por motivo de força maior.');

    expect(participanteInput).toHaveValue('p-carla');
    expect(justificativaInput).toHaveValue('Participante chegou atrasado por motivo de força maior.');

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toHaveTextContent('Presença manual registrada agora.');
    });

    expect(registrarPresencaManualMock).toHaveBeenCalledWith('enc_1', {
      participanteId: 'p-carla',
      justificativa: 'Participante chegou atrasado por motivo de força maior.',
    });
    expect(participanteInput).toHaveValue('');
    expect(justificativaInput).toHaveValue('');
  });

  it('deve lidar com sucesso 200 (idempotência - presença já existia) e limpar os campos', async () => {
    const registrarPresencaManualMock = vi.fn().mockResolvedValue({
      presenca: {
        id: 'pre_1',
        encontroId: 'enc_1',
        participanteId: 'p-carla',
        origem: 'manual',
        lidoEm: null,
        registradaEm: '2026-10-19T10:00:01-03:00',
        justificativa: 'Justificativa válida',
      },
      status: 200,
    });

    const fakeClient = {
      ...api,
      registrarPresencaManual: registrarPresencaManualMock,
    };

    render(<RegistrarPresencaManual encontroId="enc_1" apiClient={fakeClient} />);

    const participanteInput = screen.getByTestId('participante-id-input');
    const justificativaInput = screen.getByTestId('justificativa-input');

    await userEvent.type(participanteInput, 'p-carla');
    await userEvent.type(justificativaInput, 'Justificativa válida');

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toHaveTextContent('Presença já existia.');
    });

    expect(participanteInput).toHaveValue('');
    expect(justificativaInput).toHaveValue('');
  });

  it('deve tratar erro JUSTIFICATIVA_OBRIGATORIA', async () => {
    const registrarPresencaManualMock = vi.fn().mockRejectedValue(
      new ApiError(422, 'JUSTIFICATIVA_OBRIGATORIA', 'A justificativa é obrigatória e deve ter pelo menos 10 caracteres.')
    );

    const fakeClient = {
      ...api,
      registrarPresencaManual: registrarPresencaManualMock,
    };

    render(<RegistrarPresencaManual encontroId="enc_1" apiClient={fakeClient} />);

    await userEvent.type(screen.getByTestId('participante-id-input'), 'p-carla');
    await userEvent.type(screen.getByTestId('justificativa-input'), 'Curta');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('JUSTIFICATIVA_OBRIGATORIA');
      expect(errorEl).toHaveTextContent('A justificativa é obrigatória (mínimo 10 caracteres).');
    });
  });

  it('deve tratar erro NAO_INSCRITO', async () => {
    const registrarPresencaManualMock = vi.fn().mockRejectedValue(
      new ApiError(403, 'NAO_INSCRITO', 'Participante não inscrito.')
    );

    const fakeClient = {
      ...api,
      registrarPresencaManual: registrarPresencaManualMock,
    };

    render(<RegistrarPresencaManual encontroId="enc_1" apiClient={fakeClient} />);

    await userEvent.type(screen.getByTestId('participante-id-input'), 'p-desconhecido');
    await userEvent.type(screen.getByTestId('justificativa-input'), 'Justificativa válida com mais de dez caracteres.');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('NAO_INSCRITO');
      expect(errorEl).toHaveTextContent('Participante não elegível.');
    });
  });

  it('deve tratar erro FORA_DA_JANELA', async () => {
    const registrarPresencaManualMock = vi.fn().mockRejectedValue(
      new ApiError(422, 'FORA_DA_JANELA', 'Fora do horário permitido.')
    );

    const fakeClient = {
      ...api,
      registrarPresencaManual: registrarPresencaManualMock,
    };

    render(<RegistrarPresencaManual encontroId="enc_1" apiClient={fakeClient} />);

    await userEvent.type(screen.getByTestId('participante-id-input'), 'p-carla');
    await userEvent.type(screen.getByTestId('justificativa-input'), 'Justificativa válida com mais de dez caracteres.');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('FORA_DA_JANELA');
      expect(errorEl).toHaveTextContent('Fora do horário permitido para lançamento manual.');
    });
  });

  it('deve tratar erro LIMITE_DE_MANUAIS', async () => {
    const registrarPresencaManualMock = vi.fn().mockRejectedValue(
      new ApiError(422, 'LIMITE_DE_MANUAIS', 'Limite de manuais atingido.')
    );

    const fakeClient = {
      ...api,
      registrarPresencaManual: registrarPresencaManualMock,
    };

    render(<RegistrarPresencaManual encontroId="enc_1" apiClient={fakeClient} />);

    await userEvent.type(screen.getByTestId('participante-id-input'), 'p-carla');
    await userEvent.type(screen.getByTestId('justificativa-input'), 'Justificativa válida com mais de dez caracteres.');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('LIMITE_DE_MANUAIS');
      expect(errorEl).toHaveTextContent('Limite de presenças manuais atingido para este encontro.');
    });
  });

  it('deve tratar erro de rede genérico', async () => {
    const registrarPresencaManualMock = vi.fn().mockRejectedValue(
      new Error('Failed to fetch')
    );

    const fakeClient = {
      ...api,
      registrarPresencaManual: registrarPresencaManualMock,
    };

    render(<RegistrarPresencaManual encontroId="enc_1" apiClient={fakeClient} />);

    await userEvent.type(screen.getByTestId('participante-id-input'), 'p-carla');
    await userEvent.type(screen.getByTestId('justificativa-input'), 'Justificativa válida com mais de dez caracteres.');
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const errorEl = screen.getByTestId('error-message');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('ERRO_DE_REDE');
      expect(errorEl).toHaveTextContent('Failed to fetch');
    });
  });
});
