import { EnrollmentRecord, Semester } from '@/types/portal';

export const SEMESTERS: Semester[] = ['Fall 2025', 'Summer 2026'];

export function summarize(enrollments: EnrollmentRecord[]) {
  const semesters = SEMESTERS.map((semester) => {
    const rows = enrollments.filter((e) => e.semester === semester);
    const graded = rows.filter((e) => e.grade);
    const credits = graded.reduce((s, e) => s + e.credit, 0);
    const points = graded.reduce((s, e) => s + e.credit * e.grade!.point, 0);
    return { semester, rows, credits, sgpa: credits ? points / credits : 0, hasResult: graded.length > 0 };
  });
  const credits = semesters.reduce((s, x) => s + x.credits, 0);
  const points = semesters.reduce((s, x) => s + x.sgpa * x.credits, 0);
  return { semesters, credits, cgpa: credits ? points / credits : 0 };
}
