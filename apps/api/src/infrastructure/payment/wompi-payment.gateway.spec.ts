import axios from 'axios';
import { WompiPaymentGateway } from './wompi-payment.gateway';

jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('WompiPaymentGateway', () => {
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        PAYMENT_API_URL: 'https://sandbox.example/v1',
        PAYMENT_PUBLIC_KEY: 'pub_test_key',
        PAYMENT_PRIVATE_KEY: 'prv_test_key',
      };
      return values[key];
    }),
  };

  let gateway: WompiPaymentGateway;
  const mockHttp = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.create.mockReturnValue(mockHttp as never);
    mockAxios.isAxiosError.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => payload?.isAxiosError === true,
    );
    gateway = new WompiPaymentGateway(configService as never);
  });

  it('obtiene el token de aceptación', async () => {
    mockHttp.get.mockResolvedValue({
      data: {
        data: {
          presigned_acceptance: { acceptance_token: 'acceptance-token' },
        },
      },
    });

    const result = await gateway.getAcceptanceToken();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ acceptanceToken: 'acceptance-token' });
    expect(mockHttp.get).toHaveBeenCalledWith(
      '/merchants/pub_test_key',
      expect.objectContaining({
        headers: { Authorization: 'Bearer pub_test_key' },
      }),
    );
  });

  it('retorna error si no hay token de aceptación', async () => {
    mockHttp.get.mockResolvedValue({ data: { data: {} } });
    const result = await gateway.getAcceptanceToken();
    expect(result.isErr()).toBe(true);
  });

  it('crea una transacción y mapea la respuesta', async () => {
    mockHttp.post.mockResolvedValue({
      data: {
        data: {
          id: 'wompi-1',
          status: 'APPROVED',
          status_message: 'ok',
          payment_method: { brand: 'VISA', last_four: '4242' },
        },
      },
    });

    const result = await gateway.createTransaction({
      reference: 'REF-1',
      amountInCents: 108000,
      currency: 'COP',
      customerEmail: 'c@test.com',
      paymentMethod: { type: 'CARD', token: 'tok_1', installments: 1 },
      acceptanceToken: 'acceptance-token',
      signature: 'sig',
      ipAddress: '127.0.0.1',
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      id: 'wompi-1',
      status: 'APPROVED',
      cardBrand: 'VISA',
      cardLastFour: '4242',
    });
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/transactions',
      expect.objectContaining({
        amount_in_cents: 108000,
        reference: 'REF-1',
        signature: 'sig',
        ip: '127.0.0.1',
      }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer prv_test_key' },
      }),
    );
  });

  it('normaliza estados desconocidos a ERROR', async () => {
    mockHttp.post.mockResolvedValue({
      data: { data: { id: 'wompi-1', status: 'WEIRD' } },
    });
    const result = await gateway.createTransaction({
      reference: 'REF-1',
      amountInCents: 108000,
      currency: 'COP',
      customerEmail: 'c@test.com',
      paymentMethod: { type: 'CARD', token: 'tok_1' },
      acceptanceToken: 'acceptance-token',
      signature: 'sig',
    });
    expect(result._unsafeUnwrap().status).toBe('ERROR');
  });

  it('mapea errores HTTP a GatewayError con código y status', async () => {
    mockHttp.post.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: { error: { type: 'UNPROCESSABLE', reason: 'Referencia duplicada' } },
      },
    });

    const result = await gateway.createTransaction({
      reference: 'REF-1',
      amountInCents: 108000,
      currency: 'COP',
      customerEmail: 'c@test.com',
      paymentMethod: { type: 'CARD', token: 'tok_1' },
      acceptanceToken: 'acceptance-token',
      signature: 'sig',
    });

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.code).toBe('UNPROCESSABLE');
    expect(error.message).toBe('Referencia duplicada');
    expect(error.status).toBe(422);
  });

  it('consulta el estado de una transacción con la llave pública', async () => {
    mockHttp.get.mockResolvedValue({
      data: { data: { id: 'wompi-1', status: 'DECLINED', status_message: 'no' } },
    });
    const result = await gateway.getTransaction('wompi-1');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().status).toBe('DECLINED');
    expect(mockHttp.get).toHaveBeenCalledWith(
      '/transactions/wompi-1',
      expect.objectContaining({
        headers: { Authorization: 'Bearer pub_test_key' },
      }),
    );
  });
});