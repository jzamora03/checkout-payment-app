import { createHmac } from 'crypto';
import { WebhookSignatureService } from './webhook-signature.service';

const EVENTS_KEY = 'test_events_secret_key';

function buildSignature(payload: string): string {
  return createHmac('sha256', EVENTS_KEY).update(payload).digest('hex');
}

describe('WebhookSignatureService', () => {
  let service: WebhookSignatureService;

  beforeEach(() => {
    service = new WebhookSignatureService({
      getOrThrow: jest.fn(() => EVENTS_KEY),
    } as never);
  });

  it('verifica una firma válida', () => {
    const payload = Buffer.from('{"event":"transaction.updated"}');
    const signature = buildSignature(payload.toString());
    expect(service.verify(payload, signature)).toBe(true);
  });

  it('verifica una firma con prefijo sha256=', () => {
    const payload = Buffer.from('{"event":"x"}');
    const signature = `sha256=${buildSignature(payload.toString())}`;
    expect(service.verify(payload, signature)).toBe(true);
  });

  it('rechaza una firma inválida', () => {
    const payload = Buffer.from('{"event":"x"}');
    expect(service.verify(payload, 'firma-incorrecta')).toBe(false);
  });

  it('rechaza si falta la firma', () => {
    const payload = Buffer.from('{"event":"x"}');
    expect(service.verify(payload, undefined)).toBe(false);
  });

  it('rechaza firmas de distinta longitud (timingSafeEqual no lanza)', () => {
    const payload = Buffer.from('{"event":"x"}');
    const signature = buildSignature(payload.toString()).slice(0, 10);
    expect(service.verify(payload, signature)).toBe(false);
  });
});