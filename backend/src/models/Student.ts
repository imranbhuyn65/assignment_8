import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
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
  passwordHash: string;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    regNo: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    university: { type: String, default: 'Daffodil International University (DIU)', immutable: true },
    program: { type: String, default: 'B.Sc. in Computer Science & Engineering' },
    batch: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    campus: { type: String, default: 'DSC' },
    dob: { type: String, default: 'Oct 10, 2004' },
    gender: { type: String, default: 'Male' },
    bloodGroup: { type: String, default: 'O+' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
