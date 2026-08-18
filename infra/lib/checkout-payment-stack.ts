import {
  CfnOutput,
  CustomResource,
  Duration,
  Fn,
  RemovalPolicy,
  SecretValue,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_secretsmanager as secrets } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_apigatewayv2 as apigw } from 'aws-cdk-lib';
import { aws_apigatewayv2_integrations as apigw_integrations } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_s3_deployment as s3deploy } from 'aws-cdk-lib';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { aws_cloudfront_origins as origins } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_budgets as budgets } from 'aws-cdk-lib';
import { Provider } from 'aws-cdk-lib/custom-resources';

/** Extrae el host del endpoint de API Gateway sin el esquema (https://). */
function apiDomain(api: apigw.HttpApi): string {
  return Fn.select(1, Fn.split('://', api.apiEndpoint));
}

/**
 * Infraestructura de la tienda online con checkout de pago.
 *
 * - Backend NestJS en AWS Lambda (imagen Docker) detrás de API Gateway HTTP.
 * - La Lambda NO está en VPC: tiene salida a internet hacia la pasarela y a
 *   Secrets Manager, sin NAT (costo ~$0).
 * - Base de datos PostgreSQL (RDS t3.micro, free tier) con acceso público
 *   (con contraseña; datos de prueba), alcanzable por la Lambda.
 * - Frontend React estático en S3 + CloudFront con HTTPS y cabeceras OWASP.
 *   CloudFront enruta /api/* hacia el API Gateway.
 * - AWS Budgets con alerta de bajo monto.
 */
export class CheckoutPaymentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createBudget();

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    const secrets = this.createSecrets();

    const database = this.createDatabase(vpc, secrets);

    // Aplica migraciones + seed contra RDS una vez durante el deploy.
    this.createMigration(secrets, database);

    const apiGateway = this.createApi(secrets, database);

    this.createFrontend(apiGateway);
  }

  private createMigration(
    secrets: { database: secrets.ISecret },
    database: rds.DatabaseInstance,
  ): void {
    const fn = new lambda.DockerImageFunction(this, 'MigrationFunction', {
      code: lambda.DockerImageCode.fromImageAsset('../apps/api', {
        file: 'Dockerfile.migrate',
      }),
      memorySize: 512,
      timeout: Duration.minutes(5),
      architecture: lambda.Architecture.X86_64,
      // Fuera de VPC: alcanza el RDS público y Secrets Manager sin NAT.
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: this.databaseUrl(database),
      },
    });

    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [secrets.database.secretArn],
      }),
    );

    const provider = new Provider(this, 'MigrationProvider', {
      onEventHandler: fn,
    });

    const resource = new CustomResource(this, 'MigrationResource', {
      serviceToken: provider.serviceToken,
      properties: { trigger: `${Date.now()}` },
    });
    resource.node.addDependency(database);
  }

  private createBudget(): void {
    new budgets.CfnBudget(this, 'CostBudget', {
      budget: {
        budgetName: 'checkout-payment-budget',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: 1, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'ACTUAL',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'jhosephzc@gmail.com',
            },
          ],
        },
      ],
    });
  }

  private createSecrets(): { payments: secrets.ISecret; database: secrets.ISecret } {
    const payments = new secrets.Secret(this, 'PaymentsSecrets', {
      secretName: 'checkout-payment/gateway',
      description: 'Claves de la pasarela de pagos (ambiente sandbox de pruebas)',
      secretStringValue: SecretValue.unsafePlainText(
        JSON.stringify({
          PAYMENT_PUBLIC_KEY: 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7',
          PAYMENT_PRIVATE_KEY: 'prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg',
          PAYMENT_EVENTS_KEY: 'stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N',
          PAYMENT_INTEGRITY_KEY: 'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp',
        }),
      ),
    });

    const database = new secrets.Secret(this, 'DatabaseSecret', {
      secretName: 'checkout-payment/database',
      description: 'Credenciales de la base de datos PostgreSQL',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'checkout' }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      },
    });

    return { payments, database };
  }

  private createDatabase(
    vpc: ec2.Vpc,
    secrets: { database: secrets.ISecret },
  ): rds.DatabaseInstance {
    const instance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_9,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      publiclyAccessible: true,
      credentials: rds.Credentials.fromSecret(secrets.database),
      databaseName: 'checkout_payment',
      multiAz: false,
      allocatedStorage: 20,
      // Free tier: RDS limita el backup a 1 día como máximo.
      backupRetention: Duration.days(1),
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // Acceso público (con contraseña) para que la Lambda (fuera de VPC)
    // pueda conectarse. Datos de prueba.
    instance.connections.allowDefaultPortFromAnyIpv4();
    return instance;
  }

  private createApi(
    secrets: { payments: secrets.ISecret; database: secrets.ISecret },
    database: rds.DatabaseInstance,
  ): apigw.HttpApi {
    const fn = new lambda.DockerImageFunction(this, 'ApiFunction', {
      code: lambda.DockerImageCode.fromImageAsset('../apps/api', {
        file: 'Dockerfile.lambda',
      }),
      memorySize: 512,
      timeout: Duration.seconds(30),
      architecture: lambda.Architecture.X86_64,
      // Fuera de VPC: salida a internet (pasarela + Secrets Manager) sin NAT.
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: this.databaseUrl(database),
        PAYMENT_API_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
        CORS_ORIGIN: '*',
        BASE_FEE_CENTS: '3000',
        DELIVERY_FEE_CENTS: '5000',
        PAYMENT_POLL_ATTEMPTS: '8',
        PAYMENT_POLL_INTERVAL_MS: '400',
        PAYMENT_PUBLIC_KEY: secrets.payments.secretValueFromJson('PAYMENT_PUBLIC_KEY').unsafeUnwrap(),
        PAYMENT_PRIVATE_KEY: secrets.payments.secretValueFromJson('PAYMENT_PRIVATE_KEY').unsafeUnwrap(),
        PAYMENT_EVENTS_KEY: secrets.payments.secretValueFromJson('PAYMENT_EVENTS_KEY').unsafeUnwrap(),
        PAYMENT_INTEGRITY_KEY: secrets.payments
          .secretValueFromJson('PAYMENT_INTEGRITY_KEY')
          .unsafeUnwrap(),
      },
    });

    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [secrets.payments.secretArn, secrets.database.secretArn],
      }),
    );

    const api = new apigw.HttpApi(this, 'ApiGateway', {
      description: 'Checkout Payment API',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

    api.addRoutes({
      path: '/{proxy+}',
      methods: [apigw.HttpMethod.ANY],
      integration: new apigw_integrations.HttpLambdaIntegration('ApiIntegration', fn),
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.apiEndpoint,
    });

    return api;
  }

  private createFrontend(api: apigw.HttpApi): void {
    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: 'checkout-payment-app-' + this.account,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'FrontendDeploy', {
      sources: [s3deploy.Source.asset('../apps/web/dist')],
      destinationBucket: bucket,
    });

    const securityHeaders = new cloudfront.ResponseHeadersPolicy(
      this,
      'SecurityHeadersPolicy',
      {
        comment: 'Cabeceras de seguridad OWASP para la SPA',
        securityHeadersBehavior: {
          strictTransportSecurity: {
            override: true,
            accessControlMaxAge: Duration.days(365),
            includeSubdomains: true,
            preload: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: { override: true, frameOption: cloudfront.HeadersFrameOption.DENY },
          referrerPolicy: {
            override: true,
            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          },
          contentSecurityPolicy: {
            override: true,
            contentSecurityPolicy:
              "default-src 'self'; connect-src 'self' https://api-sandbox.co.uat.wompi.dev; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
              override: true,
            },
          ],
        },
      },
    );

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
    );
    bucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: securityHeaders,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(apiDomain(api), {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originId: 'api-gateway-origin',
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        },
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    new CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }

  private databaseUrl(database: rds.DatabaseInstance): string {
    const password = database.secret
      ? database.secret.secretValueFromJson('password').unsafeUnwrap()
      : '';
    return Fn.join('', [
      'postgresql://checkout:',
      password,
      '@',
      database.dbInstanceEndpointAddress,
      ':',
      database.dbInstanceEndpointPort,
      '/checkout_payment',
    ]);
  }
}
