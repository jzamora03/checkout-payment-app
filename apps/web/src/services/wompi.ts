import { env } from '../env';
import type { CardForm, TokenizedCard } from '../types';
import { getCardBrand } from '../features/card/cardUtils';

export class TokenizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenizationError';
  }
}

/**
 * Tokeniza la tarjeta directamente con la llave pública de la pasarela.
 * El PAN nunca viaja por nuestro backend.
 */
export async function tokenizeCard(card: CardForm): Promise<TokenizedCard> {
  const paymentApiUrl = env.paymentApiUrl;
  const publicKey = env.paymentPublicKey;
  if (!paymentApiUrl || !publicKey) {
    throw new TokenizationError('La configuración de pagos no está disponible');
  }

  const [expMonth, expYear] = card.expiry.split('/');

  const response = await fetch(`${paymentApiUrl}/tokens/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicKey}`,
    },
    body: JSON.stringify({
      number: card.number.replace(/\s/g, ''),
      cvc: card.cvc,
      exp_month: expMonth,
      exp_year: `20${expYear}`,
      card_holder: card.holder,
    }),
  });

  if (!response.ok) {
    throw new TokenizationError('La tarjeta fue rechazada al tokenizarse');
  }

  const body = (await response.json()) as {
    data?: { id?: string; brand?: string; last_four?: string };
  };
  const data = body.data;
  if (!data?.id) {
    throw new TokenizationError('No se obtuvo el token de la tarjeta');
  }

  return {
    id: data.id,
    brand: data.brand ?? getCardBrand(card.number),
    lastFour: data.last_four ?? card.number.replace(/\s/g, '').slice(-4),
  };
}