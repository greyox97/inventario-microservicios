import { AbstractControl, ValidationErrors } from '@angular/forms';

export function notBlank(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { notBlank: true }
    : null;
}
