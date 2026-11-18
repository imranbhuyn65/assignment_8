import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  teacherId: string;
  name: string;
  university: string;
  designation: string;
  department: string;
  email: string;
  passwordHash: string;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    teacherId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    university: { type: String, default: 'Daffodil International University (DIU)', immutable: true },
    designation: { type: String, default: 'Faculty Advisor' },
    department: { type: String, default: 'Department of CSE' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
