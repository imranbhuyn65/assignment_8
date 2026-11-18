export type Role = 'student' | 'teacher';
export type Semester = 'Fall 2025' | 'Summer 2026';

export interface StudentProfile {
  studentId: string;
  regNo: string;
  name: string;
  university: string;
  program: string;
  batch: string;
  email: string;
  phone: string;
  campus: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  status: 'Active' | 'Inactive';
}

export interface TeacherProfile {
  teacherId: string;
  name: string;
  university: string;
  designation: string;
  department: string;
  email: string;
}

export interface Marks {
  attendance: number;
  assignment: number;
  quiz: number;
  midterm: number;
  final: number;
}

export interface GradeResult {
  total: number;
  letter: string;
  point: number;
}

export interface EnrollmentRecord {
  _id: string;
  studentId: string;
  semester: Semester;
  courseCode: string;
  courseTitle: string;
  credit: number;
  faculty: string;
  registeredBy: string;
  marks: Marks | null;
  published: boolean;
  grade: GradeResult | null;
}

export function previewUGCGrade(marks: Marks): GradeResult {
  const total =
    Math.round(
      (Number(marks.attendance || 0) +
        Number(marks.assignment || 0) +
        Number(marks.quiz || 0) +
        Number(marks.midterm || 0) +
        Number(marks.final || 0)) *
        10
    ) / 10;

  if (total >= 80) return { total, letter: 'A+', point: 4.0 };
  if (total >= 75) return { total, letter: 'A', point: 3.75 };
  if (total >= 70) return { total, letter: 'A-', point: 3.5 };
  if (total >= 65) return { total, letter: 'B+', point: 3.25 };
  if (total >= 60) return { total, letter: 'B', point: 3.0 };
  if (total >= 55) return { total, letter: 'B-', point: 2.75 };
  if (total >= 50) return { total, letter: 'C+', point: 2.5 };
  if (total >= 45) return { total, letter: 'C', point: 2.25 };
  if (total >= 40) return { total, letter: 'D', point: 2.0 };
  return { total, letter: 'F', point: 0.0 };
}

export interface Course {
  _id: string;
  code: string;
  title: string;
  credit: number;
  createdBy: string;
}

export type EventType = 'Class' | 'Exam' | 'Holiday' | 'Deadline' | 'Event';
export interface CalendarEvent {
  _id: string;
  title: string;
  date: string;
  type: EventType;
  note: string;
  createdBy: string;
}

export const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export interface RoutineEntry {
  _id: string;
  semester: Semester;
  courseCode: string;
  courseTitle: string;
  day: (typeof DAYS)[number];
  startTime: string;
  endTime: string;
  room: string;
  faculty: string;
}

export interface Ratings {
  teaching: number;
  clarity: number;
  punctuality: number;
  support: number;
}
export interface MyEvaluation {
  enrollmentId: string;
  ratings: Ratings;
  comment: string;
}
export interface EvaluationReport {
  semester: string;
  courseCode: string;
  courseTitle: string;
  count: number;
  averages: Ratings;
  overall: number;
  comments: string[];
}

export type RequestKind = 'clearance' | 'improvement' | 'certificate' | 'convocation';
export interface ServiceRequest {
  _id: string;
  studentId: string;
  studentName: string;
  kind: RequestKind;
  detail: string;
  semester: string;
  enrollmentId: string;
  status: 'pending' | 'approved' | 'rejected';
  remark: string;
  decidedBy: string;
  createdAt: string;
}
