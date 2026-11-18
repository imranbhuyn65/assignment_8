import mongoose, { Schema, Document } from 'mongoose';

export interface IMarks {
  attendance: number;
  assignment: number;
  quiz: number;
  midterm: number;
  final: number;
}

export interface IEnrollment extends Document {
  studentId: string;
  semester: 'Fall 2025' | 'Summer 2026';
  courseCode: string;
  courseTitle: string;
  credit: number;
  faculty: string;
  registeredBy: string;
  marks: IMarks | null;
  published: boolean;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: { type: String, required: true, index: true },
    semester: { type: String, enum: ['Fall 2025', 'Summer 2026'], required: true },
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    credit: { type: Number, required: true, min: 0.5, max: 6 },
    faculty: { type: String, required: true },
    registeredBy: { type: String, required: true },
    marks: {
      type: {
        attendance: { type: Number, min: 0, max: 10, required: true },
        assignment: { type: Number, min: 0, max: 15, required: true },
        quiz: { type: Number, min: 0, max: 15, required: true },
        midterm: { type: Number, min: 0, max: 25, required: true },
        final: { type: Number, min: 0, max: 35, required: true },
      },
      default: null,
    },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ studentId: 1, semester: 1, courseCode: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
