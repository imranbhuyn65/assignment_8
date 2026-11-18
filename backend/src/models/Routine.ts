import mongoose, { Schema, Document } from 'mongoose';

export const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export interface IRoutine extends Document {
  semester: 'Fall 2025' | 'Summer 2026';
  courseCode: string;
  courseTitle: string;
  day: (typeof DAYS)[number];
  startTime: string;
  endTime: string;
  room: string;
  faculty: string;
}

const RoutineSchema = new Schema<IRoutine>(
  {
    semester: { type: String, enum: ['Fall 2025', 'Summer 2026'], required: true },
    courseCode: { type: String, required: true, uppercase: true },
    courseTitle: { type: String, required: true },
    day: { type: String, enum: DAYS, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: 'TBA', trim: true },
    faculty: { type: String, required: true },
  },
  { timestamps: true }
);

export const Routine = mongoose.model<IRoutine>('Routine', RoutineSchema);
