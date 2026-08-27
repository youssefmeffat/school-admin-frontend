import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./pages/students/students.component').then((m) => m.StudentsComponent),
  },
  {
    path: 'classes',
    loadComponent: () =>
      import('./pages/classes/classes.component').then((m) => m.ClassesComponent),
  },
  {
    path: 'grades',
    loadComponent: () =>
      import('./pages/grades/grades.component').then((m) => m.GradesComponent),
  },
  {
    path: 'teachers',
    loadComponent: () =>
      import('./pages/teachers/teachers.component').then((m) => m.TeachersComponent),
  },
  {
    path: 'subjects',
    loadComponent: () =>
      import('./pages/subjects/subjects.component').then((m) => m.SubjectsComponent),
  },
  {
    path: 'exams',
    loadComponent: () =>
      import('./pages/exams/exams.component').then((m) => m.ExamsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
