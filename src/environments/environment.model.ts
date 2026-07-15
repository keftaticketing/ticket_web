export interface AppEnvironment {
    production: boolean;
    name: 'local' | 'dev' | 'qa' | 'production';
    apiUrl: string;
    clientId: string;
    clientKey: string;
}
