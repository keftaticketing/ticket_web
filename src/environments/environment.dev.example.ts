import { AppEnvironment } from './environment.model';

/** Shared dev API. Copy to environment.dev.ts and fill in values. */
export const environment: AppEnvironment = {
    production: false,
    name: 'dev',
    apiUrl: 'https://YOUR_DEV_API_HOST/api',
    clientId: 'ticket-admin',
    clientKey: 'YOUR_CLIENT_KEY'
};
