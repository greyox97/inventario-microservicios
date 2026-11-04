import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Confirm } from '../../core/services/confirm';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  protected readonly confirm = inject(Confirm);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.confirm.pending()) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
    });
  }
}
