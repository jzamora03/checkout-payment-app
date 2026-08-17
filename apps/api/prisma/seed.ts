import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    sku: 'AUR-PRO-001',
    name: 'Auriculares Inalámbricos Pro',
    description:
      'Auriculares over-ear con cancelación activa de ruido, 30 horas de batería y carga rápida USB-C.',
    priceInCents: 249900,
    stock: 12,
    imageUrl: 'https://placehold.co/400x400/EEF2FF/1E293B?text=Auriculares',
  },
  {
    sku: 'TEC-RGB-002',
    name: 'Teclado Mecánico RGB',
    description:
      'Teclado mecánico compacto con switches red, iluminación RGB personalizable y keycaps dobles.',
    priceInCents: 189900,
    stock: 20,
    imageUrl: 'https://placehold.co/400x400/F5F3FF/1E293B?text=Teclado',
  },
  {
    sku: 'MON-4K-003',
    name: 'Monitor 27" 4K',
    description:
      'Monitor IPS de 27 pulgadas con resolución 4K, 99% sRGB y puertos HDMI 2.1 y USB-C.',
    priceInCents: 899900,
    stock: 8,
    imageUrl: 'https://placehold.co/400x400/ECFEFF/1E293B?text=Monitor',
  },
  {
    sku: 'MOU-GAM-004',
    name: 'Mouse Gamer Ergonómico',
    description:
      'Mouse inalámbrico con sensor de 16000 DPI, 8 botones programables y batería de 70 horas.',
    priceInCents: 129900,
    stock: 25,
    imageUrl: 'https://placehold.co/400x400/FEF2F2/1E293B?text=Mouse',
  },
  {
    sku: 'BAS-CAR-005',
    name: 'Base de Carga Inalámbrica',
    description:
      'Base de carga rápida Qi 15W compatible con iPhone y Android. Incluye adaptador de 20W.',
    priceInCents: 99900,
    stock: 0,
    imageUrl: 'https://placehold.co/400x400/FFFBEB/1E293B?text=Base',
  },
  {
    sku: 'WEB-HD-006',
    name: 'Webcam Full HD',
    description:
      'Cámara web 1080p30 con micrófonos duales, corrección de luz y cobertura de privacidad.',
    priceInCents: 159900,
    stock: 15,
    imageUrl: 'https://placehold.co/400x400/F0FDF4/1E293B?text=Webcam',
  },
];

async function main(): Promise<void> {
  console.log('Sembrando productos...');
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  const count = await prisma.product.count();
  console.log(`Seed finalizado. ${count} productos disponibles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
