import { execSync } from 'child_process';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ok } from 'neverthrow';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PaymentGatewayPort } from '../src/application/ports/payment-gateway.port';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

const TEST_DATABASE_URL =
  'postgresql://checkout:checkout_dev@localhost:5435/checkout_payment_test';

const mockGateway = {
  getAcceptanceToken: jest.fn(),
  createTransaction: jest.fn(),
  getTransaction: jest.fn(),
};

describe('API e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let productId: string;

  const createPayload = (overrides: Record<string, unknown> = {}) => ({
    productId,
    cardToken: 'tok_test_1234567890',
    customer: {
      email: 'e2e@test.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      documentType: 'CC',
      documentNumber: '1067985555',
      phone: '3001234567',
    },
    delivery: {
      addressLine1: 'Carrera 10 # 20-30',
      addressLine2: null,
      city: 'Bogota',
      state: 'Cundinamarca',
      postalCode: '110111',
      country: 'CO',
      notes: null,
    },
    ...overrides,
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'ignore',
    });

    mockGateway.getAcceptanceToken.mockResolvedValue(
      ok({ acceptanceToken: 'acceptance-token' }),
    );
    mockGateway.createTransaction.mockResolvedValue(
      ok({ id: 'gateway-e2e-1', status: 'PENDING', statusMessage: null }),
    );
    mockGateway.getTransaction.mockResolvedValue(
      ok({ id: 'gateway-e2e-1', status: 'APPROVED', statusMessage: 'ok' }),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PaymentGatewayPort)
      .useValue(mockGateway)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.delivery.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.product.deleteMany(),
    ]);
    const created = await prisma.product.create({
      data: {
        sku: 'E2E-001',
        name: 'Producto e2e',
        description: 'Descripción',
        priceInCents: 100000,
        currency: 'COP',
        stock: 5,
        isActive: true,
      },
    });
    productId = created.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('lista productos con su stock', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toMatchObject({
      name: 'Producto e2e',
      stock: 5,
      isPurchasable: true,
    });
  });

  it('rechaza un id de producto inválido', async () => {
    await request(app.getHttpServer()).get('/api/v1/products/no-uuid').expect(400);
  });

  it('procesa un checkout aprobado, descuenta stock y asigna la entrega', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/checkout/transactions')
      .send(createPayload())
      .expect(201);

    expect(response.body.transaction.status).toBe('APPROVED');
    expect(response.body.transaction.totalInCents).toBe(108000);
    expect(response.body.transaction.reference).toMatch(/^REF-/);
    expect(response.body.delivery.status).toBe('ASSIGNED');
    expect(response.body.product.stock).toBe(4);

    const persisted = await prisma.transaction.findUnique({
      where: { reference: response.body.transaction.reference },
    });
    expect(persisted?.status).toBe('APPROVED');
    expect(persisted?.gatewayTransactionId).toBe('gateway-e2e-1');
  });

  it('procesa un checkout declinado sin tocar el stock', async () => {
    mockGateway.getTransaction.mockResolvedValue(
      ok({ id: 'gateway-e2e-2', status: 'DECLINED', statusMessage: 'Fondos insuficientes' }),
    );
    mockGateway.createTransaction.mockResolvedValue(
      ok({ id: 'gateway-e2e-2', status: 'PENDING', statusMessage: null }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/checkout/transactions')
      .send(createPayload({ customer: { ...createPayload().customer, email: 'decl@test.com' } }))
      .expect(201);

    expect(response.body.transaction.status).toBe('DECLINED');

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(5);
  });

  it('rechaza el checkout cuando el producto no tiene stock', async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 0 } });

    const response = await request(app.getHttpServer())
      .post('/api/v1/checkout/transactions')
      .send(createPayload({ customer: { ...createPayload().customer, email: 'nostock@test.com' } }))
      .expect(409);

    expect(response.body.message).toContain('stock');
  });

  it('valida el cuerpo de la solicitud (400)', async () => {
    const bad = createPayload();
    bad.customer.email = 'no-es-email';
    await request(app.getHttpServer())
      .post('/api/v1/checkout/transactions')
      .send(bad)
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/checkout/transactions')
      .send({ ...createPayload(), cardToken: 'corto' })
      .expect(400);
  });

  it('consulta el estado de una transacción por referencia', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/checkout/transactions')
      .send(createPayload({ customer: { ...createPayload().customer, email: 'status@test.com' } }))
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/checkout/transactions/${created.body.transaction.reference}`)
      .expect(200);

    expect(response.body.transaction.reference).toBe(
      created.body.transaction.reference,
    );
  });

  it('devuelve 404 para una referencia inexistente', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/checkout/transactions/REF-NO-EXISTE')
      .expect(404);
  });

  it('rechaza el webhook con firma inválida', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/webhooks/payments')
      .set('x-signature', 'firma-mala')
      .send({ event: 'transaction.updated' })
      .expect(400);
  });
});