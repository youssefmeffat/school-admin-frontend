import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmDialogState | null>(null);

  private resolver: ((result: boolean) => void) | null = null;

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    // Resolve any dialog left hanging before opening a new one.
    this.resolver?.(false);

    this.state.set({
      title: options.title ?? 'Please confirm',
      message: options.message,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      danger: options.danger ?? false,
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  resolve(result: boolean): void {
    this.resolver?.(result);
    this.resolver = null;
    this.state.set(null);
  }
}
