# Checkout Payment App

Aplicación de tienda online con flujo de onboarding para pago con tarjeta de crédito y entrega a domicilio.

## Stack

- **Frontend:** React 18 + Vite + Redux Toolkit (SPA mobile-first)
- **Backend:** NestJS + TypeScript (arquitectura hexagonal + Railway Oriented Programming)
- **Base de datos:** PostgreSQL 16 + Prisma ORM
- **Pasarela de pagos:** API sandbox de la pasarela (solo ambiente de pruebas, sin dinero real)
- **Tests:** Jest (unit + e2e) con cobertura >80%
- **Infraestructura:** AWS CDK (S3 + CloudFront, ECS Fargate, RDS)

## Arquitectura

_En construcción..._ (diagrama de arquitectura y detalle completo en el README final)

## Estructura del monorepo

```
checkout-payment-app/
├── apps/
│   ├── api/            # Backend NestJS
│   └── web/            # Frontend React
├── infra/              # IaC AWS CDK
└── docker-compose.yml  # PostgreSQL local
```

## Requisitos

- Node.js >= 20
- Docker
- npm

## Ejecución local

_En construcción..._ (comandos de arranque con Docker)

## Documentación API

_En construcción..._ (endpoints, data model y colección Postman)
