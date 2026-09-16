import { randomBytes } from 'crypto';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function gerarCodigo(): string {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]);
  return `SA26-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}
