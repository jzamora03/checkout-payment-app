import { tokenizeCard, TokenizationError } from './wompi';
import { env } from '../env';

describe('tokenizeCard', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    env.paymentApiUrl = 'https://sandbox.example/v1';
    env.paymentPublicKey = 'pub_test_key';
  });

  it('tokeniza una tarjeta correctamente', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { id: 'tok_123', brand: 'VISA', last_four: '4242' },
        }),
    } as Response);

    const result = await tokenizeCard({
      number: '4242 4242 4242 4242',
      holder: 'Juan Perez',
      expiry: '12/99',
      cvc: '123',
    });

    expect(result).toEqual({ id: 'tok_123', brand: 'VISA', lastFour: '4242' });
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://sandbox.example/v1/tokens/cards');
    expect(options.headers.Authorization).toBe('Bearer pub_test_key');
    const body = JSON.parse(options.body);
    expect(body.number).toBe('4242424242424242');
    expect(body.exp_month).toBe('12');
    expect(body.exp_year).toBe('2099');
  });

  it('lanza error si falta la configuración', async () => {
    env.paymentApiUrl = undefined;
    env.paymentPublicKey = undefined;

    await expect(
      tokenizeCard({
        number: '4242 4242 4242 4242',
        holder: 'Juan',
        expiry: '12/99',
        cvc: '123',
      }),
    ).rejects.toBeInstanceOf(TokenizationError);
  });

  it('lanza error si la pasarela rechaza', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
    } as Response);

    await expect(
      tokenizeCard({
        number: '4242 4242 4242 4242',
        holder: 'Juan',
        expiry: '12/99',
        cvc: '123',
      }),
    ).rejects.toBeInstanceOf(TokenizationError);
  });

  it('lanza error si no viene el token en la respuesta', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);

    await expect(
      tokenizeCard({
        number: '4242 4242 4242 4242',
        holder: 'Juan',
        expiry: '12/99',
        cvc: '123',
      }),
    ).rejects.toBeInstanceOf(TokenizationError);
  });
});