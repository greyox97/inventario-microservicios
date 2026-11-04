import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Notifier {
  readonly message = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  success(text: string): void {
    clearTimeout(this.timer);
    this.message.set(text);
    this.timer = setTimeout(() => this.message.set(null), 8000);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.message.set(null);
  }
}
