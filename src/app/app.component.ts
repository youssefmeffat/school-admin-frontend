import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

interface NavItem {
  label: string;
  path: string;
  icon: string; // svg path data, single path
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Greenwood Admin';

  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'M3 13h4v7H3v-7zm7-9h4v16h-4V4zm7 5h4v11h-4V9z' },
    { label: 'Students', path: '/students', icon: 'M12 3 2 8l10 5 8-4.2V17h1.5V8L12 3zM6 11.5v4.7c0 1.9 2.7 3.3 6 3.3s6-1.4 6-3.3v-4.7L12 14l-6-2.5z' },
    { label: 'Classes', path: '/classes', icon: 'M4 4h16v3H4V4zm0 6.5h16v3H4v-3zM4 17h10v3H4v-3z' },
    { label: 'Grades', path: '/grades', icon: 'M4 4h16v3H4V4zm0 6.5h10v3H4v-3zM4 17h16v3H4v-3z' },
    { label: 'Teachers', path: '/teachers', icon: 'M12 12c2.7 0 8 1.34 8 4v3H4v-3c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    {
      label: 'Subjects',
      path: '/subjects',
      icon: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v2h10V7H7zm0 4v2h7v-2H7zm0 4v2h10v-2H7z'
    },
    { label: 'Exams', path: '/exams', icon: 'M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm3 11 2 2 4-4' },
  ];
}
