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
});
