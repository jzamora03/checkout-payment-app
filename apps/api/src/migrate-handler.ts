import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

/**
 * Handler para un custom resource de CDK que aplica las migraciones de
 * Prisma y siembra los productos contra la base de datos de RDS.
 * Se ejecuta una sola vez durante el despliegue.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any): Promise<any> => {
  const requestType = event.RequestType;

  if (requestType === 'Delete') {
    // No hacemos nada al eliminar el stack.
    return { Status: 'SUCCESS' };
  }

  Logger.log(`Aplicando migraciones (${requestType})...`, 'Migrate');
  execSync('npx prisma migrate deploy', {
    cwd: '/app',
    env: { ...process.env },
    stdio: 'inherit',
  });

  Logger.log('Ejecutando seed...', 'Migrate');
  try {
    execSync('node /app/dist/src/serverless-seed.js', {
      cwd: '/app',
      env: { ...process.env },
      stdio: 'inherit',
    });
  } catch (error) {
    Logger.warn('Seed no aplicado (puede que ya existan datos)', 'Migrate');
  }

  return { Status: 'SUCCESS' };
};