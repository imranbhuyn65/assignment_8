export interface MarksInput {
  attendance: number; // max 10
  assignment: number; // max 15
  quiz: number;       // max 15
  midterm: number;    // max 25
  final: number;      // max 35
}

export interface GradeResult {
  total: number;
  letter: string;
  point: number;
}

export function calculateUGCGrade(marks: MarksInput | null | undefined): GradeResult | null {
  if (!marks) return null;
  const rawTotal =
    Number(marks.attendance || 0) +
    Number(marks.assignment || 0) +
    Number(marks.quiz || 0) +
    Number(marks.midterm || 0) +
    Number(marks.final || 0);
  const total = Math.round(rawTotal * 10) / 10;

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

// CGPA over every published result (credit-weighted)
export function cgpaOf(records: { credit: number; marks: MarksInput | null }[]): { cgpa: number; credits: number } {
  let credits = 0;
  let points = 0;
  for (const r of records) {
    const g = calculateUGCGrade(r.marks);
    if (!g) continue;
    credits += r.credit;
    points += r.credit * g.point;
  }
  return { cgpa: credits ? points / credits : 0, credits };
}
