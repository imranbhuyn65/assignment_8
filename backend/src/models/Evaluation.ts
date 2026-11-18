import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluation extends Document {
  enrollmentId: string;
  studentId: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  faculty: string;
  ratings: { teaching: number; clarity: number; punctuality: number; support: number };
  comment: string;
}

const rating = { type: Number, min: 1, max: 5, required: true };

const EvaluationSchema = new Schema<IEvaluation>(
  {
    enrollmentId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true, index: true },
    semester: { type: String, required: true },
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    faculty: { type: String, required: true, index: true },
    ratings: { teaching: rating, clarity: rating, punctuality: rating, support: rating },
    comment: { type: String, default: '', trim: true, maxlength: 600 },
  },
  { timestamps: true }
);

export const Evaluation = mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
