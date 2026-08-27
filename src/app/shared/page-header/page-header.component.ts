import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow" *ngIf="eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p class="subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 26px;
      flex-wrap: wrap;
    }
    .eyebrow {
      display: block;
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--brass);
      margin-bottom: 6px;
    }
    h1 { font-size: 26px; }
    .subtitle { margin: 6px 0 0; color: var(--muted); font-size: 13.5px; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  `],
})
export class PageHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
}
