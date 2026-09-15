import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Shell', () => {
  it('deve renderizar o título principal do esqueleto', () => {
    render(<App />);
    expect(screen.getByText('Semana Acadêmica')).toBeInTheDocument();
  });
});
