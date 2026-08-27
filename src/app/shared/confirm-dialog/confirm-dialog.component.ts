import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  private confirmDialogService = inject(ConfirmDialogService);

  readonly state = this.confirmDialogService.state;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.state()) {
      this.cancel();
    }
  }

  confirm(): void {
    this.confirmDialogService.resolve(true);
  }

  cancel(): void {
    this.confirmDialogService.resolve(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}
