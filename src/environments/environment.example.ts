import { AppEnvironment } from './environment.model';

/** Production build (`npm run build`). Copy to environment.ts and fill in values. */
export const environment: AppEnvironment = {
    production: true,
    name: 'production',
    apiUrl: 'https://YOUR_API_HOST/api',
    clientId: 'ticket-admin',
    clientKey: 'YOUR_CLIENT_KEY'
};
