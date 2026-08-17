import { Environment, validateEnv } from './env.validation';

const baseEnv: Record<string, unknown> = {
  NODE_ENV: Environment.Development,
  PORT: 3000,
  DATABASE_URL: 'postgresql://user:pass@localhost:5434/db',
  PAYMENT_API_URL: 'https://sandbox.example.com/v1',
  PAYMENT_PUBLIC_KEY: 'pub_test_abcdefghij',
  PAYMENT_PRIVATE_KEY: 'prv_test_abcdefghij',
  PAYMENT_EVENTS_KEY: 'test_events_abcdefghij',
  PAYMENT_INTEGRITY_KEY: 'test_integrity_abcdefghij',
  BASE_FEE_CENTS: 3000,
  DELIVERY_FEE_CENTS: 5000,
};

describe('validateEnv', () => {
  it('valida una configuración correcta', () => {
    const result = validateEnv(baseEnv);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe(Environment.Development);
  });

  it('lanza si falta una variable obligatoria', () => {
    const { PAYMENT_PRIVATE_KEY: _pk, ...incomplete } = baseEnv;
    expect(() => validateEnv(incomplete)).toThrow('Configuración de entorno inválida');
  });

  it('lanza si el puerto es inválido', () => {
    expect(() => validateEnv({ ...baseEnv, PORT: 99999 })).toThrow();
  });

  it('lanza si las tarifas no son enteros', () => {
    expect(() => validateEnv({ ...baseEnv, BASE_FEE_CENTS: -5 })).toThrow();
  });

  it('lanza si la URL del API no es válida', () => {
    expect(() => validateEnv({ ...baseEnv, PAYMENT_API_URL: 'no-url' })).toThrow();
  });

  it('acepta configuración de producción', () => {
    const result = validateEnv({ ...baseEnv, NODE_ENV: Environment.Production });
    expect(result.NODE_ENV).toBe(Environment.Production);
  });
});