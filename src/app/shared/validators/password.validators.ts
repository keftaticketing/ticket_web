import { SchemaPath, validate } from '@angular/forms/signals';

export function passwordPolicy(path: SchemaPath<string>) {
    validate(path, (ctx) => {
        const password = ctx.value();
        if (!password) {
            return null;
        }

        if (password.length < 8) {
            return { kind: 'minLength', message: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { kind: 'uppercase', message: 'Password must include an uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { kind: 'lowercase', message: 'Password must include a lowercase letter' };
        }
        if (!/\d/.test(password)) {
            return { kind: 'digit', message: 'Password must include a digit' };
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            return { kind: 'special', message: 'Password must include a special character' };
        }

        return null;
    });
}
