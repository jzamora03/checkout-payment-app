import {
  CfnOutput,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_secretsmanager as secrets } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_ecr_assets as ecr_assets } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_s3_deployment as s3deploy } from 'aws-cdk-lib';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { aws_cloudfront_origins as origins } from 'aws-cdk-lib';

/**
 * Infraestructura completa para la tienda online con checkout de pago.
 *
 * - Base de datos PostgreSQL (RDS) con credenciales en Secrets Manager.
 * - API NestJS en ECS Fargate detrás de un Application Load Balancer.
 * - Frontend React estático servido por S3 + CloudFront con HTTPS y
 *   cabeceras de seguridad (OWASP).
 * - Claves de la pasarela de pagos guardadas en Secrets Manager.
 */
export class CheckoutPaymentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const secrets = this.createSecrets();

    const database = this.createDatabase(vpc);

    const api = this.createApi(vpc, secrets, database);

    this.createFrontend(api);
  }

  private createSecrets(): { payments: secrets.ISecret } {
    const payments = new secrets.Secret(this, 'PaymentsSecrets', {
      secretName: 'checkout-payment/gateway',
      description:
        'Claves de la pasarela de pagos (ambiente sandbox de pruebas)',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          PAYMENT_PUBLIC_KEY: 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7',
          PAYMENT_PRIVATE_KEY: 'prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg',
          PAYMENT_EVENTS_KEY: 'stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N',
          PAYMENT_INTEGRITY_KEY: 'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'PAYMENT_PLACEHOLDER',
      },
    });

    return { payments };
  }

  private createDatabase(vpc: ec2.Vpc): rds.DatabaseInstance {
    const databaseSecret = new secrets.Secret(this, 'DatabaseSecret', {
      secretName: 'checkout-payment/database',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'checkout' }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      },
    });

    const instance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromSecret(databaseSecret),
      databaseName: 'checkout_payment',
      multiAz: false,
      allocatedStorage: 20,
      backupRetention: Duration.days(7),
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    instance.connections.allowDefaultPortFromAnyIpv4();
    return instance;
  }

  private createApi(
    vpc: ec2.Vpc,
    secrets: { payments: secrets.ISecret },
    database: rds.DatabaseInstance,
  ): { url: string } {
    const cluster = new ecs.Cluster(this, 'ApiCluster', {
      vpc,
      containerInsights: true,
    });

    const image = ecs.ContainerImage.fromAsset('../apps/api', {
      platform: ecr_assets.Platform.LINUX_AMD64,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const service = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    service.node.addDependency(database);

    const environment = {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: this.databaseUrl(database),
      PAYMENT_API_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
      CORS_ORIGIN: '*',
      BASE_FEE_CENTS: '3000',
      DELIVERY_FEE_CENTS: '5000',
      PAYMENT_POLL_ATTEMPTS: '8',
      PAYMENT_POLL_INTERVAL_MS: '400',
    };

    const container = taskDefinition.addContainer('ApiContainer', {
      image,
      environment,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'checkout-api' }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'wget -qO- http://localhost:3000/api/v1/products || exit 1',
        ],
        interval: Duration.seconds(10),
        timeout: Duration.seconds(5),
        retries: 3,
      },
    });

    container.addPortMappings({ containerPort: 3000, protocol: ecs.Protocol.TCP });

    const secretEnv = {
      PAYMENT_PUBLIC_KEY: ecs.Secret.fromSecretsManager(secrets.payments, 'PAYMENT_PUBLIC_KEY'),
      PAYMENT_PRIVATE_KEY: ecs.Secret.fromSecretsManager(secrets.payments, 'PAYMENT_PRIVATE_KEY'),
      PAYMENT_EVENTS_KEY: ecs.Secret.fromSecretsManager(secrets.payments, 'PAYMENT_EVENTS_KEY'),
      PAYMENT_INTEGRITY_KEY: ecs.Secret.fromSecretsManager(
        secrets.payments,
        'PAYMENT_INTEGRITY_KEY',
      ),
    };
    Object.entries(secretEnv).forEach(([key, value]) => {
      container.addSecret(key, value);
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'ApiLb', {
      vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('ApiListener', { port: 80 });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/api/v1/products',
        healthyHttpCodes: '200',
      },
    });

    listener.addTargetGroups('ApiTargets', { targetGroups: [targetGroup] });

    return { url: lb.loadBalancerDnsName };
  }

  private createFrontend(api: { url: string }): void {
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
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Content-Security-Policy',
              value:
                "default-src 'self'; connect-src 'self' https://api-sandbox.co.uat.wompi.dev; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
              override: true,
            },
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
      database.instanceEndpoint.hostname,
      ':',
      database.instanceEndpoint.port.toString(),
      '/checkout_payment',
    ]);
  }
}
