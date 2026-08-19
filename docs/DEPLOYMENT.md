# Deployment

The project supports two environments:

- `qa`
- `prod`

Each environment has its own env file:

- `.env.qa`
- `.env.prod`

Copy the examples before the first deploy:

```bash
cp .env.qa.example .env.qa
cp .env.prod.example .env.prod
```

## Build

```bash
npm run build:qa
npm run build:prod
```

## Deploy

```bash
npm run deploy:qa
npm run deploy:prod
```

or:

```bash
npm run deploy -- qa
npm run deploy -- prod
```

The deploy script:

1. Loads `.env.<environment>`.
2. Runs `next build`.
3. Runs Firebase deploy for hosting, Firestore rules, and Firestore indexes.

## Domain

The custom domain is configured in Firebase Hosting per environment/project. Once the domain is connected to the Firebase project, `npm run deploy:prod` publishes the current build to that production domain.
