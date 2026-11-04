import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    }
    const detail = err.error?.detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  return fallback;
}
