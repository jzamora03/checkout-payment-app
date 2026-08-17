import * as cdk from 'aws-cdk-lib';
import { CheckoutPaymentStack } from '../lib/checkout-payment-stack';

const app = new cdk.App();

new CheckoutPaymentStack(app, 'CheckoutPaymentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'Tienda online con checkout de pago (frontend + API + base de datos)',
});