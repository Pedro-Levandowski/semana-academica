import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificarCertificado } from './VerificarCertificado';
import { api } from '../api/client';
import { formatarDataHoraBrasilia } from '../utils/date';

describe('VerificarCertificado Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const verificacao = {
    codigo: 'SA26-7K2M-9QXA',
    participante: 'Carla M. S.',
    atividade: 'Flutter do zero',
    cargaHorariaMinutos: 360,
    emitidoEm: '2026-10-23T22:00:00-03:00',
  };

  it('contexto público: sem selectedUserId/userPapel renderiza o formulário e não consulta automaticamente', () => {
    const getCertificadoPorCodigoMock = vi.fn();
    const fakeClient = {
      ...api,
      getCertificadoPorCodigo: getCertificadoPorCodigoMock,
    };

    render(<VerificarCertificado apiClient={fakeClient} />);

    expect(screen.getByLabelText('Código do Certificado:')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /verificar certificado/i })
    ).toBeInTheDocument();
    expect(getCertificadoPorCodigoMock).not.toHaveBeenCalled();
  });

  it('tempo de espera: consulta ao enviar, mostra loading acessível e desabilita o botão', async () => {
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    const getCertificadoPorCodigoMock = vi.fn().mockReturnValue(pendingPromise);
    const fakeClient = {
      ...api,
      getCertificadoPorCodigo: getCertificadoPorCodigoMock,
    };

    render(<VerificarCertificado apiClient={fakeClient} />);

    await userEvent.type(
      screen.getByLabelText('Código do Certificado:'),
      'SA26-7K2M-9QXA'
    );
    fireEvent.click(
      screen.getByRole('button', { name: /verificar certificado/i })
    );

    expect(getCertificadoPorCodigoMock).toHaveBeenCalledWith('SA26-7K2M-9QXA');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Verificando certificado...'
    );
    expect(screen.getByRole('button', { name: /verificando/i })).toBeDisabled();

    await act(async () => {
      resolvePromise(verificacao);
    });
  });

  it('sucesso: apresenta exatamente os campos públicos da Verificacao', async () => {
    const getCertificadoPorCodigoMock = vi.fn().mockResolvedValue(verificacao);
    const fakeClient = {
      ...api,
      getCertificadoPorCodigo: getCertificadoPorCodigoMock,
    };

    render(<VerificarCertificado apiClient={fakeClient} />);

    await userEvent.type(
      screen.getByLabelText('Código do Certificado:'),
      'SA26-7K2M-9QXA'
    );
    fireEvent.click(
      screen.getByRole('button', { name: /verificar certificado/i })
    );

    const container = await screen.findByTestId(
      'verificar-certificado-container'
    );

    expect(container).toHaveTextContent('SA26-7K2M-9QXA');
    expect(container).toHaveTextContent('Carla M. S.');
    expect(container).toHaveTextContent('Flutter do zero');
    expect(container).toHaveTextContent('360');
    expect(container).toHaveTextContent(
      formatarDataHoraBrasilia(verificacao.emitidoEm)
    );
  });

  it('não encontrado: exibe alert com NAO_ENCONTRADO e mensagem do 404', async () => {
    const getCertificadoPorCodigoMock = vi.fn().mockRejectedValue({
      erro: 'NAO_ENCONTRADO',
      mensagem: 'Recurso não encontrado',
    });
    const fakeClient = {
      ...api,
      getCertificadoPorCodigo: getCertificadoPorCodigoMock,
    };

    render(<VerificarCertificado apiClient={fakeClient} />);

    await userEvent.type(
      screen.getByLabelText('Código do Certificado:'),
      'SA26-7K2M-9QXA'
    );
    fireEvent.click(
      screen.getByRole('button', { name: /verificar certificado/i })
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('NAO_ENCONTRADO');
    expect(alert).toHaveTextContent('Recurso não encontrado');
  });

  it('erro genérico: exibe role="alert" com código e mensagem distintos do 404', async () => {
    const getCertificadoPorCodigoMock = vi.fn().mockRejectedValue({
      erro: 'ERRO_INTERNO',
      mensagem: 'Falha ao verificar certificado',
    });
    const fakeClient = {
      ...api,
      getCertificadoPorCodigo: getCertificadoPorCodigoMock,
    };

    render(<VerificarCertificado apiClient={fakeClient} />);

    await userEvent.type(
      screen.getByLabelText('Código do Certificado:'),
      'SA26-7K2M-9QXA'
    );
    fireEvent.click(
      screen.getByRole('button', { name: /verificar certificado/i })
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('ERRO_INTERNO');
    expect(alert).toHaveTextContent('Falha ao verificar certificado');
    expect(alert).not.toHaveTextContent(/não encontrado/i);
  });

  it('normalização: envia para a API o código com trim e uppercase', async () => {
    const getCertificadoPorCodigoMock = vi.fn().mockResolvedValue(verificacao);
    const fakeClient = {
      ...api,
      getCertificadoPorCodigo: getCertificadoPorCodigoMock,
    };

    render(<VerificarCertificado apiClient={fakeClient} />);

    await userEvent.type(
      screen.getByLabelText('Código do Certificado:'),
      '  sa26-7k2m-9qxa  '
    );
    fireEvent.click(
      screen.getByRole('button', { name: /verificar certificado/i })
    );

    expect(getCertificadoPorCodigoMock).toHaveBeenCalledWith('SA26-7K2M-9QXA');

    expect(
      await screen.findByTestId('verificar-certificado-container')
    ).toBeInTheDocument();
  });
});