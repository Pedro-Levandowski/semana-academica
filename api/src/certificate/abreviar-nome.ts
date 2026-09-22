const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos']);
const PARTICULAS_PROTETORAS = new Set(['da', 'dos']);

export function abreviarNome(nome: string): string {
  const partes = nome.split(/\s+/);

  if (partes.length <= 1) {
    return nome;
  }

  const resultado: string[] = [partes[0]];

  for (let i = 1; i < partes.length; i++) {
    const parte = partes[i];
    const minuscula = parte.toLowerCase();

    if (PARTICULAS.has(minuscula)) {
      resultado.push(minuscula);
      continue;
    }

    const ehUltima = i === partes.length - 1;
    const anterior = partes[i - 1].toLowerCase();
    const particulaLogoAposPrimeiroNome = i === 2;
    const deveManterPorExtenso =
      ehUltima && PARTICULAS_PROTETORAS.has(anterior) && !particulaLogoAposPrimeiroNome;

    resultado.push(deveManterPorExtenso ? parte : parte.charAt(0).toUpperCase() + '.');
  }

  return resultado.join(' ');
}