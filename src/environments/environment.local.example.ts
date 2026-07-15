import { AppEnvironment } from './environment.model';

/** Local machine: `npm run start:local`. Copy to environment.local.ts and fill in values. */
export const environment: AppEnvironment = {
    production: false,
    name: 'local',
    apiUrl: 'http://localhost:5162/api',
    clientId: 'ticket-admin',
    clientKey: 'YOUR_CLIENT_KEY'
};
