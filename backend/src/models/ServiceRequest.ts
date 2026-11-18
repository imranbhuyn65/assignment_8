import mongoose, { Schema, Document } from 'mongoose';

export const REQUEST_KINDS = ['clearance', 'improvement', 'certificate', 'convocation'] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export interface IServiceRequest extends Document {
  studentId: string;
  studentName: string;
  kind: RequestKind;
  detail: string; // e.g. "Exam Clearance", "Transcript", "CSE111 — Programming"
  semester: string;
  enrollmentId: string;
  status: 'pending' | 'approved' | 'rejected';
  remark: string;
  decidedBy: string;
}

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    kind: { type: String, enum: REQUEST_KINDS, required: true },
    detail: { type: String, default: '' },
    semester: { type: String, default: '' },
    enrollmentId: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    remark: { type: String, default: '' },
    decidedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ServiceRequest = mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
