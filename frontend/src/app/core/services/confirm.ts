import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
}

interface Pending extends ConfirmOptions {
  resolve: (accepted: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class Confirm {
  readonly pending = signal<Pending | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    this.pending()?.resolve(false);
    return new Promise((resolve) => this.pending.set({ ...options, resolve }));
  }

  answer(accepted: boolean): void {
    const current = this.pending();
    this.pending.set(null);
    current?.resolve(accepted);
  }
}
