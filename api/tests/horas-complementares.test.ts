import { describe, it, expect } from 'vitest';
import {
  somarCargasBrutas,
  calcularAproveitadoMinutos,
  type AtividadeExtrato
} from '../src/certificate/horas-complementares.js';

const mkAtividade = (tipo: 'palestra' | 'minicurso', cargaHorariaMinutos: number): AtividadeExtrato => ({
  tipo,
  cargaHorariaMinutos,
});

describe('R3 — Cargas horárias brutas integrais no extrato', () => {
  it('somatórios brutos de palestras e minicursos permanecem integrais', () => {
    const itens = [
      mkAtividade('palestra', 300),
      mkAtividade('minicurso', 500),
    ];
    const { palestrasMinutos, minicursosMinutos, totalMinutos } = somarCargasBrutas(itens);

    expect(palestrasMinutos).toBe(300);
    expect(minicursosMinutos).toBe(500);
    expect(totalMinutos).toBe(800);
  });

  it('totalMinutos é a soma bruta dos dois tipos', () => {
    const itens = [
      mkAtividade('palestra', 120),
      mkAtividade('minicurso', 1300),
    ];
    const { palestrasMinutos, minicursosMinutos, totalMinutos } = somarCargasBrutas(itens);

    expect(palestrasMinutos).toBe(120);
    expect(minicursosMinutos).toBe(1300);
    expect(totalMinutos).toBe(1420);
  });

  it('palestra com carga bruta acima de 240 mantém valor integral no bruto', () => {
    const itens = [mkAtividade('palestra', 250)];
    const { palestrasMinutos } = somarCargasBrutas(itens);

    expect(palestrasMinutos).toBe(250);
  });

  it('valor abaixo de 240 mantém integral (sem teto aplicado ao bruto)', () => {
    const itens = [mkAtividade('palestra', 90)];
    const { palestrasMinutos, totalMinutos } = somarCargasBrutas(itens);

    expect(palestrasMinutos).toBe(90);
    expect(totalMinutos).toBe(90);
  });

  it('lista vazia retorna zero em todos os campos', () => {
    const { palestrasMinutos, minicursosMinutos, totalMinutos } = somarCargasBrutas([]);

    expect(palestrasMinutos).toBe(0);
    expect(minicursosMinutos).toBe(0);
    expect(totalMinutos).toBe(0);
  });
});

describe('R4 — Teto de aproveitamento de palestras (240 min)', () => {
  it('palestras abaixo de 240 → aproveitado = valor bruto', () => {
    expect(calcularAproveitadoMinutos(239, 0)).toBe(239);
  });

  it('palestras no limite de 240 → aproveitado = 240', () => {
    expect(calcularAproveitadoMinutos(240, 0)).toBe(240);
  });

  it('palestras acima de 240 → aproveitado de palestras é 240 (não o bruto)', () => {
    expect(calcularAproveitadoMinutos(250, 0)).toBe(240);
  });

  it('palestras de 300 + minicursos de 500 → aproveitado = min(240, 300) + 500 = 740', () => {
    expect(calcularAproveitadoMinutos(300, 500)).toBe(740);
  });

  it('palestras de 90 + zero minicursos → aproveitado = 90 (sem teto atingido)', () => {
    expect(calcularAproveitadoMinutos(90, 0)).toBe(90);
  });
});

describe('R5 — Teto total de aproveitamento (1200 min)', () => {
  it('aproveitamento combinado abaixo de 1200 → resultado integral', () => {
    expect(calcularAproveitadoMinutos(300, 500)).toBe(740);
  });

  it('aproveitamento combinado acima de 1200 → resultado é 1200 (teto total)', () => {
    expect(calcularAproveitadoMinutos(120, 1300)).toBe(1200);
  });

  it('aproveitamento combinado exatamente 1200 → resultado é 1200 (no limite)', () => {
    expect(calcularAproveitadoMinutos(240, 960)).toBe(1200);
  });

  it('zero palestras e zero minicursos → aproveitado = 0', () => {
    expect(calcularAproveitadoMinutos(0, 0)).toBe(0);
  });

  it('minicursos de 1200 sem palestras → aproveitado = 1200 (no teto)', () => {
    expect(calcularAproveitadoMinutos(0, 1200)).toBe(1200);
  });

  it('minicursos acima de 1200 sem palestras → aproveitado = 1200', () => {
    expect(calcularAproveitadoMinutos(0, 1300)).toBe(1200);
  });
});
