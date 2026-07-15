import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '@/app/core/models/api.models';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (!(error instanceof HttpErrorResponse)) {
        return fallback;
    }

    const body = error.error as ApiErrorResponse | string | null;
    if (typeof body === 'string' && body.trim()) {
        return body;
    }

    if (body && typeof body === 'object') {
        return body.description || body.detail || body.title || fallback;
    }

    return fallback;
}
