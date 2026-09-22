import { describe, it, expect } from 'vitest';
import { gerarCodigo } from '../src/certificate/gerar-codigo.js';

const RE_FORMATO = /^SA26-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

describe('R6 + R11 — Geração do código do certificado', () => {
  describe('R6 — Formato SA26-XXXX-XXXX', () => {
    it('gera código com exatamente 14 caracteres no total', () => {
      const codigo = gerarCodigo();
      expect(codigo).toHaveLength(14);
    });

    it('gera código com o prefixo fixo SA26-', () => {
      const codigo = gerarCodigo();
      expect(codigo.startsWith('SA26-')).toBe(true);
    });

    it('gera código com dois blocos de 4 caracteres separados por hífen', () => {
      const codigo = gerarCodigo();
      const partes = codigo.split('-');
      expect(partes).toHaveLength(3);
      expect(partes[0]).toBe('SA26');
      expect(partes[1]).toHaveLength(4);
      expect(partes[2]).toHaveLength(4);
    });

    it('todos os caracteres variáveis são letras maiúsculas ou dígitos', () => {
      for (let i = 0; i < 20; i++) {
        const codigo = gerarCodigo();
        const variaveis = codigo.slice(5).replace('-', '');
        expect(variaveis).toMatch(/^[A-Z0-9]{8}$/);
      }
    });
  });

  describe('R11 — Alfabeto permitido (sem I, O, 0 e 1)', () => {
    it('não contém o caractere I', () => {
      for (let i = 0; i < 20; i++) {
        const codigo = gerarCodigo();
        expect(codigo).not.toContain('I');
      }
    });

    it('não contém o caractere O', () => {
      for (let i = 0; i < 20; i++) {
        const codigo = gerarCodigo();
        expect(codigo).not.toContain('O');
      }
    });

    it('não contém o dígito 0', () => {
      for (let i = 0; i < 20; i++) {
        const codigo = gerarCodigo();
        expect(codigo).not.toContain('0');
      }
    });

    it('não contém o dígito 1', () => {
      for (let i = 0; i < 20; i++) {
        const codigo = gerarCodigo();
        expect(codigo).not.toContain('1');
      }
    });

    it('todos os 8 caracteres variáveis pertencem ao alfabeto válido (letras maiúsculas sem I/O e dígitos sem 0/1)', () => {
      const ALFABETO = /^[A-HJ-NP-Z2-9]$/;
      for (let i = 0; i < 20; i++) {
        const codigo = gerarCodigo();
        const variaveis = codigo.slice(5).replace('-', '');
        for (const caractere of variaveis) {
          expect(caractere).toMatch(ALFABETO);
        }
      }
    });

    it('formato completo confere com o padrão SA26-XXXX-XXXX com alfabeto restrito', () => {
      for (let i = 0; i < 20; i++) {
        const codigo = gerarCodigo();
        expect(codigo).toMatch(RE_FORMATO);
      }
    });
  });

  describe('R6 — Unicidade', () => {
    it('duas chamadas consecutivas geram códigos diferentes', () => {
      const codigo1 = gerarCodigo();
      const codigo2 = gerarCodigo();
      expect(codigo1).not.toBe(codigo2);
    });

    it('gera 50 códigos únicos em 50 chamadas', () => {
      const codigos = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codigos.add(gerarCodigo());
      }
      expect(codigos.size).toBe(50);
    });
  });
});
