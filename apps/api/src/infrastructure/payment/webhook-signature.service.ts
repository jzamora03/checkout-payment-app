import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookSignatureService {
  private readonly eventsKey: string;

  constructor(configService: ConfigService) {
    this.eventsKey = configService.getOrThrow<string>('PAYMENT_EVENTS_KEY');
  }

  verify(payload: Buffer, signatureHeader?: string): boolean {
    if (!signatureHeader) {
      return false;
    }
    const given = signatureHeader.replace(/^sha256=/i, '');
    const expected = createHmac('sha256', this.eventsKey).update(payload).digest('hex');

    const givenBuffer = Buffer.from(given);
    const expectedBuffer = Buffer.from(expected);
    if (givenBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(givenBuffer, expectedBuffer);
  }
}