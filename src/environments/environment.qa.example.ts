import { AppEnvironment } from './environment.model';

/** QA API. Copy to environment.qa.ts and fill in values. */
export const environment: AppEnvironment = {
    production: false,
    name: 'qa',
    apiUrl: 'https://YOUR_QA_API_HOST/api',
    clientId: 'ticket-admin',
    clientKey: 'YOUR_CLIENT_KEY'
};
