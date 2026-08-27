import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-label">{{ label }}</span>
        <span class="stat-delta" [class.negative]="delta < 0" *ngIf="delta !== undefined">
          {{ delta > 0 ? '+' : '' }}{{ delta }}%
        </span>
      </div>
      <span class="stat-value">{{ value }}</span>
      <span class="stat-note" *ngIf="note">{{ note }}</span>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 3px solid var(--forest-800);
    }
    .stat-top { display: flex; align-items: center; justify-content: space-between; }
    .stat-label {
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .stat-delta {
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      color: var(--forest-700);
    }
    .stat-delta.negative { color: var(--danger); }
    .stat-value {
      font-family: var(--font-display);
      font-size: 32px;
      font-weight: 600;
      color: var(--forest-900);
      line-height: 1.1;
    }
    .stat-note { font-size: 12px; color: var(--muted); }
  `],
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() delta?: number;
  @Input() note = '';
}
