// Placeholder shapes — swap these for the generated models/DTOs from the
// ASP.NET backend once they're available. Kept in one file so that swap
// touches a single import path across the app.

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  homeroom: string;
  status: 'Active' | 'Pending' | 'Withdrawn';
  guardianEmail: string;
  enrolledOn: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject: string;
  department: string;
  classesTaught: number;
  status: 'Active' | 'On Leave';
  email: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  subject: string;
  teacherName: string;
  period: string;
  room: string;
  enrolled: number;
  capacity: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  className: string;
  date: string;
  proctor: string;
  status: 'Scheduled' | 'Grading' | 'Published';
}
