/**
 * Cores para contas e categorias, tiradas das cédulas do Real.
 * Quando as notas acabam, entram as moedas.
 */
export const MONEY_COLORS = [
  { value: '#3a6db3', label: 'Azul da nota de R$ 100' },
  { value: '#c4703a', label: 'Ocre da nota de R$ 50' },
  { value: '#e0a12c', label: 'Amarelo da nota de R$ 20' },
  { value: '#c0463b', label: 'Vermelho da nota de R$ 10' },
  { value: '#8a63a8', label: 'Lilás da nota de R$ 5' },
  { value: '#4f7194', label: 'Azul-acinzentado da nota de R$ 2' },
  { value: '#86694a', label: 'Sépia da nota de R$ 200' },
  { value: '#1d7a46', label: 'Verde do troco' },
  { value: '#a88a3c', label: 'Dourado da moeda de R$ 1' },
  { value: '#8b939b', label: 'Prata da moeda de 50 centavos' },
] as const

export const FALLBACK_COLOR = '#8b939b'

export const NOTE = {
  blue: '#3a6db3',
  ochre: '#c4703a',
  yellow: '#e0a12c',
  red: '#c0463b',
  lilac: '#8a63a8',
  slate: '#4f7194',
  sepia: '#86694a',
} as const
