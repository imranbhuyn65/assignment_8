import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEvent extends Document {
  title: string;
  date: string; // YYYY-MM-DD
  type: 'Class' | 'Exam' | 'Holiday' | 'Deadline' | 'Event';
  note: string;
  createdBy: string;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    type: { type: String, enum: ['Class', 'Exam', 'Holiday', 'Deadline', 'Event'], default: 'Event' },
    note: { type: String, default: '', trim: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
