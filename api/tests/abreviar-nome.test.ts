import { describe, it, expect } from 'vitest';
import { abreviarNome } from '../src/certificate/abreviar-nome.js';

describe('R7 — Abreviação do nome na verificação pública', () => {
  describe('Critérios da spec (13 e 14)', () => {
    it('Carla Mendes Souza → "Carla M. S."', () => {
      expect(abreviarNome('Carla Mendes Souza')).toBe('Carla M. S.');
    });

    it('Elisa Fernandes da Rocha → "Elisa F. da Rocha"', () => {
      expect(abreviarNome('Elisa Fernandes da Rocha')).toBe('Elisa F. da Rocha');
    });

    it('Isadora Ribeiro dos Santos → "Isadora R. dos Santos"', () => {
      expect(abreviarNome('Isadora Ribeiro dos Santos')).toBe('Isadora R. dos Santos');
    });
  });

  describe('Primeiro nome sempre por extenso', () => {
    it('nome único permanece intacto', () => {
      expect(abreviarNome('Carla')).toBe('Carla');
    });

    it('dois nomes: segundo vira inicial', () => {
      expect(abreviarNome('Ana Silva')).toBe('Ana S.');
    });
  });

  describe('Partículas de, da, do, das, dos permanecem por extenso e minúsculas', () => {
    it('partícula "de" entre nomes', () => {
      expect(abreviarNome('Maria de Souza Lima')).toBe('Maria de S. L.');
    });

    it('partícula "dos" no final', () => {
      expect(abreviarNome('Pedro dos Santos Alves')).toBe('Pedro dos S. A.');
    });

    it('partícula "das" no meio', () => {
      expect(abreviarNome('Ana das Dores Silva')).toBe('Ana das D. S.');
    });

    it('partícula "do" entre nomes', () => {
      expect(abreviarNome('Lucas do Nascimento')).toBe('Lucas do N.');
    });

    it('múltiplas partículas da spec', () => {
      expect(abreviarNome('Maria de Souza da Silva')).toBe('Maria de S. da Silva');
    });
  });

  describe('Nomes compostos sem partícula', () => {
    it('quatro nomes: primeiro extenso, demais iniciais', () => {
      expect(abreviarNome('Carlos Eduardo Silva Santos')).toBe('Carlos E. S. S.');
    });

    it('cinco nomes', () => {
      expect(abreviarNome('Fernanda Oliveira Costa Lima Santos')).toBe('Fernanda O. C. L. S.');
    });
  });

  describe('Partículas no início (antes do segundo nome)', () => {
    it('partícula logo após o primeiro nome', () => {
      expect(abreviarNome('Maria da Silva')).toBe('Maria da S.');
    });
  });

  describe('Nomes com partículas adjacentes a iniciais', () => {
    it('partícula entre duas iniciais abreviadas', () => {
      expect(abreviarNome('Ricardo de A. B. C.')).toBe('Ricardo de A. B. C.');
    });
  });
});
