'use client';

import React, { useMemo, useState } from 'react';
import { Check, Lock, Printer, Star, Send, GraduationCap } from 'lucide-react';
import {
  EnrollmentRecord,
  MyEvaluation,
  Ratings,
  RoutineEntry,
  Semester,
  ServiceRequest,
  StudentProfile,
  CalendarEvent,
  RequestKind,
} from '@/types/portal';
import { api, useFetch, Notify } from '@/lib/api';
import { summarize } from '@/lib/results';
import { Badge, Empty, Pad, Panel, Stat, Table } from './ui';
import { CalendarList, RequestTable, RoutineGrid } from './shared';

interface Props {
  student: StudentProfile;
  semester: Semester;
  enrollments: EnrollmentRecord[];
  notify: Notify;
}

/* ───────── shared hook for apply-type features ───────── */
function useMyRequests(kind: RequestKind, notify: Notify) {
  const { data, reload } = useFetch<ServiceRequest[]>('/api/student/requests', []);
  const submit = async (payload: Record<string, string>) => {
    try {
      await api('/api/student/requests', 'POST', { kind, ...payload });
      await reload();
      notify('Application submitted. Waiting for teacher approval.');
    } catch (e: any) {
      notify(e.message, true);
    }
  };
  return { rows: data.filter((r) => r.kind === kind), submit };
}

const applyBtn =
  'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition';

/* ───────── DASHBOARD ───────── */
export function StudentDashboard({ student, semester, enrollments }: Props) {
  const sum = useMemo(() => summarize(enrollments), [enrollments]);
  const count = enrollments.filter((e) => e.semester === semester).length;
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-100 rounded-3xl p-7 border border-blue-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-blue-700 text-white flex items-center justify-center text-3xl font-extrabold border-4 border-white shadow">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="mt-3 bg-lime-600 text-white text-xs font-bold px-4 py-1 rounded-full inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {student.status}
            </span>
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Daffodil International University (DIU)
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">{student.name}</h2>
            <p className="text-sm font-semibold text-slate-700">{student.program}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs font-medium text-slate-700">
              <div>Reg: {student.regNo}</div>
              <div>Email: {student.email}</div>
              <div>DOB: {student.dob}</div>
              <div>ID: {student.studentId}</div>
              <div>Phone: {student.phone}</div>
              <div>Gender: {student.gender}</div>
              <div>Batch: {student.batch}</div>
              <div>Campus: {student.campus}</div>
              <div>Blood: {student.bloodGroup}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="CGPA" value={sum.credits ? sum.cgpa.toFixed(2) : '—'} tone="emerald" />
        <Stat label="Credits Earned (graded)" value={String(sum.credits)} />
        <Stat label={`Courses • ${semester}`} value={String(count)} tone="amber" />
        <Stat label="Published Results" value={String(enrollments.filter((e) => e.grade).length)} />
      </div>
    </div>
  );
}

/* ───────── ACADEMIC CALENDAR ───────── */
export function StudentCalendar() {
  const { data } = useFetch<CalendarEvent[]>('/api/calendar', []);
  return (
    <Panel title="Academic Calendar">
      <CalendarList events={data} />
    </Panel>
  );
}

/* ───────── COURSE REGISTRATION (read-only) ───────── */
export function StudentCourseReg({ semester, enrollments }: Props) {
  const rows = enrollments.filter((e) => e.semester === semester);
  return (
    <Panel
      title={`Registered Courses — ${semester}`}
      right={
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Lock className="w-3.5 h-3.5" /> Teacher-Registered Only (Read-Only)
        </span>
      }
    >
      {rows.length === 0 ? (
        <Empty text={`No courses registered yet for ${semester}.`} />
      ) : (
        <Table head={['Code', 'Course Title', 'Credit', 'Registered By']}>
          {rows.map((en) => (
            <tr key={en._id}>
              <td className="py-3.5 px-6 font-mono font-bold text-blue-700">{en.courseCode}</td>
              <td className="py-3.5 px-6 font-semibold">{en.courseTitle}</td>
              <td className="py-3.5 px-6">{en.credit.toFixed(1)}</td>
              <td className="py-3.5 px-6 text-slate-500">{en.registeredBy}</td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

/* ───────── REGISTRATION / EXAM CLEARANCE ───────── */
export function StudentClearance({ semester, notify }: Props) {
  const { rows, submit } = useMyRequests('clearance', notify);
  return (
    <div className="space-y-6">
      <Panel title={`Apply for Clearance — ${semester}`}>
        <Pad>
          <p className="text-xs text-slate-500">
            Submit a clearance request for the selected semester. A teacher will approve or reject it.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Registration Clearance', 'Exam Clearance'].map((d) => (
              <button key={d} className={applyBtn} onClick={() => submit({ detail: d, semester })}>
                <Send className="w-3.5 h-3.5" /> {d}
              </button>
            ))}
          </div>
        </Pad>
      </Panel>
      <Panel title="My Clearance Applications">
        <RequestTable rows={rows} />
      </Panel>
    </div>
  );
}

/* ───────── ROUTINE ───────── */
export function StudentRoutine({ semester }: Props) {
  const { data } = useFetch<RoutineEntry[]>(`/api/routine?semester=${encodeURIComponent(semester)}`, []);
  return (
    <Panel title={`Class Routine — ${semester}`}>
      <RoutineGrid entries={data} />
    </Panel>
  );
}

/* ───────── TEACHING EVALUATION ───────── */
const CRITERIA: { key: keyof Ratings; label: string }[] = [
  { key: 'teaching', label: 'Teaching quality' },
  { key: 'clarity', label: 'Clarity of lectures' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'support', label: 'Support & feedback' },
];

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star`}
        >
          <Star className={`w-5 h-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

export function StudentEvaluation({ semester, enrollments, notify }: Props) {
  const { data: done, reload } = useFetch<MyEvaluation[]>('/api/student/evaluations', []);
  const [openId, setOpenId] = useState('');
  const [ratings, setRatings] = useState<Ratings>({ teaching: 5, clarity: 5, punctuality: 5, support: 5 });
  const [comment, setComment] = useState('');
  const rows = enrollments.filter((e) => e.semester === semester);

  const submit = async () => {
    try {
      await api('/api/student/evaluations', 'POST', { enrollmentId: openId, ratings, comment });
      setOpenId('');
      setComment('');
      await reload();
      notify('Evaluation submitted anonymously. Thank you!');
    } catch (e: any) {
      notify(e.message, true);
    }
  };

  return (
    <Panel title={`Teaching Evaluation — ${semester}`}>
      {rows.length === 0 ? (
        <Empty text="No registered courses to evaluate." />
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((en) => {
            const mine = done.find((d) => d.enrollmentId === en._id);
            return (
              <div key={en._id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm">
                      <span className="text-blue-700">{en.courseCode}</span> — {en.courseTitle}
                    </div>
                    <div className="text-xs text-slate-500">Faculty: {en.faculty}</div>
                  </div>
                  {mine ? (
                    <Badge status="approved" />
                  ) : (
                    <button className={applyBtn} onClick={() => setOpenId(openId === en._id ? '' : en._id)}>
                      Evaluate
                    </button>
                  )}
                </div>
                {openId === en._id && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    {CRITERIA.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">{label}</span>
                        <Stars value={ratings[key]} onChange={(n) => setRatings((r) => ({ ...r, [key]: n }))} />
                      </div>
                    ))}
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={600}
                      rows={3}
                      placeholder="Optional comment (anonymous)"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className={applyBtn} onClick={submit}>
                      <Send className="w-3.5 h-3.5" /> Submit Evaluation
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

/* ───────── LIVE RESULTS ───────── */
export function StudentLiveResults({ semester, enrollments }: Props) {
  const rows = enrollments.filter((e) => e.semester === semester);
  return (
    <Panel
      dark
      title={`Live Results — ${semester}`}
      right={<span className="text-xs font-bold text-emerald-400">● Live Synced</span>}
    >
      {rows.length === 0 ? (
        <Empty text={`No registered courses in ${semester}.`} />
      ) : (
        <Table head={['Course', 'Att (10)', 'Assg (15)', 'Quiz (15)', 'Mid (25)', 'Final (35)', 'Total', 'Grade']}>
          {rows.map((en) => (
            <tr key={en._id}>
              <td className="py-3.5 px-6 font-bold text-blue-700">
                {en.courseCode} — <span className="text-slate-700 font-medium">{en.courseTitle}</span>
              </td>
              {!en.marks || !en.grade ? (
                <td colSpan={7} className="py-3.5 px-6 text-center text-xs text-amber-700 font-semibold">
                  Awaiting Teacher Mark Input
                </td>
              ) : (
                <>
                  <td className="py-3.5 px-6 text-center">{en.marks.attendance}</td>
                  <td className="py-3.5 px-6 text-center">{en.marks.assignment}</td>
                  <td className="py-3.5 px-6 text-center">{en.marks.quiz}</td>
                  <td className="py-3.5 px-6 text-center">{en.marks.midterm}</td>
                  <td className="py-3.5 px-6 text-center">{en.marks.final}</td>
                  <td className="py-3.5 px-6 text-center font-extrabold">{en.grade.total}</td>
                  <td className="py-3.5 px-6 text-center font-extrabold text-emerald-700">
                    {en.grade.letter} ({en.grade.point.toFixed(2)})
                  </td>
                </>
              )}
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

/* ───────── IMPROVEMENT APPLY ───────── */
export function StudentImprovement({ enrollments, notify }: Props) {
  const { rows, submit } = useMyRequests('improvement', notify);
  const eligible = enrollments.filter((e) => e.grade && e.grade.point > 0 && e.grade.point < 3.0);
  return (
    <div className="space-y-6">
      <Panel title="Eligible Courses for Improvement" right={<span className="text-xs text-slate-500">Grade below B (F must be retaken)</span>}>
        {eligible.length === 0 ? (
          <Empty text="No eligible courses. Improvement is available for published grades below B." />
        ) : (
          <Table head={['Semester', 'Course', 'Grade', 'Action']}>
            {eligible.map((en) => {
              const applied = rows.some((r) => r.enrollmentId === en._id && r.status !== 'rejected');
              return (
                <tr key={en._id}>
                  <td className="py-3 px-6 text-slate-500">{en.semester}</td>
                  <td className="py-3 px-6 font-semibold">
                    <span className="text-blue-700 font-mono">{en.courseCode}</span> — {en.courseTitle}
                  </td>
                  <td className="py-3 px-6 font-bold">{en.grade!.letter}</td>
                  <td className="py-3 px-6">
                    {applied ? (
                      <span className="text-xs font-bold text-slate-400">Applied</span>
                    ) : (
                      <button className={applyBtn} onClick={() => submit({ enrollmentId: en._id, semester: en.semester })}>
                        Apply
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Panel>
      <Panel title="My Improvement Applications">
        <RequestTable rows={rows} />
      </Panel>
    </div>
  );
}

/* ───────── ACADEMIC RESULTS (SGPA / CGPA) ───────── */
export function StudentAcademicResults({ enrollments }: Props) {
  const sum = useMemo(() => summarize(enrollments), [enrollments]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Overall CGPA" value={sum.credits ? sum.cgpa.toFixed(2) : '—'} tone="emerald" />
        <Stat label="Total Graded Credits" value={String(sum.credits)} />
      </div>
      {sum.semesters.map((s) => (
        <Panel
          key={s.semester}
          title={s.semester}
          right={<span className="text-xs font-bold text-blue-700">SGPA: {s.hasResult ? s.sgpa.toFixed(2) : '—'}</span>}
        >
          {s.rows.length === 0 ? (
            <Empty text="No courses in this semester." />
          ) : (
            <Table head={['Code', 'Course', 'Credit', 'Total', 'Grade', 'Point']}>
              {s.rows.map((en) => (
                <tr key={en._id}>
                  <td className="py-3 px-6 font-mono font-bold text-blue-700">{en.courseCode}</td>
                  <td className="py-3 px-6 font-semibold">{en.courseTitle}</td>
                  <td className="py-3 px-6">{en.credit.toFixed(1)}</td>
                  <td className="py-3 px-6">{en.grade ? en.grade.total : '—'}</td>
                  <td className="py-3 px-6 font-bold">{en.grade ? en.grade.letter : 'Pending'}</td>
                  <td className="py-3 px-6">{en.grade ? en.grade.point.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ───────── CERTIFICATES & TRANSCRIPTS ───────── */
export function StudentCertificates({ student, enrollments, notify }: Props) {
  const { rows, submit } = useMyRequests('certificate', notify);
  const [showTranscript, setShowTranscript] = useState(false);
  const sum = useMemo(() => summarize(enrollments), [enrollments]);
  return (
    <div className="space-y-6">
      <Panel title="Apply for Documents">
        <Pad>
          <div className="flex flex-wrap gap-3">
            {['Transcript', 'Provisional Certificate', 'Testimonial', 'Grade Sheet'].map((d) => (
              <button key={d} className={applyBtn} onClick={() => submit({ detail: d })}>
                <Send className="w-3.5 h-3.5" /> {d}
              </button>
            ))}
          </div>
        </Pad>
      </Panel>
      <Panel title="My Document Requests">
        <RequestTable rows={rows} />
      </Panel>
      <Panel
        title="Unofficial Transcript"
        right={
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-xs font-bold"
              onClick={() => setShowTranscript((v) => !v)}
            >
              {showTranscript ? 'Hide' : 'Preview'}
            </button>
            {showTranscript && (
              <button className={applyBtn} onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            )}
          </div>
        }
      >
        {showTranscript ? (
          <div className="print-area p-8 bg-white">
            <div className="text-center border-b pb-4 mb-4">
              <GraduationCap className="w-8 h-8 mx-auto text-blue-700" />
              <h3 className="text-lg font-extrabold">Daffodil International University</h3>
              <p className="text-xs text-slate-500">Unofficial Academic Transcript</p>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs mb-5">
              <div>Name: <b>{student.name}</b></div>
              <div>ID: <b>{student.studentId}</b></div>
              <div>Program: <b>{student.program}</b></div>
              <div>Batch: <b>{student.batch}</b></div>
            </div>
            {sum.semesters
              .filter((s) => s.rows.length)
              .map((s) => (
                <div key={s.semester} className="mb-5">
                  <div className="flex justify-between text-xs font-extrabold mb-1">
                    <span>{s.semester}</span>
                    <span>SGPA: {s.hasResult ? s.sgpa.toFixed(2) : '—'}</span>
                  </div>
                  <table className="w-full text-xs border border-slate-300">
                    <tbody>
                      {s.rows.map((en) => (
                        <tr key={en._id} className="border-t border-slate-200">
                          <td className="p-1.5 font-mono">{en.courseCode}</td>
                          <td className="p-1.5">{en.courseTitle}</td>
                          <td className="p-1.5">{en.credit.toFixed(1)}</td>
                          <td className="p-1.5 font-bold">{en.grade ? en.grade.letter : '—'}</td>
                          <td className="p-1.5">{en.grade ? en.grade.point.toFixed(2) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            <div className="text-right text-sm font-extrabold">
              CGPA: {sum.credits ? sum.cgpa.toFixed(2) : '—'} ({sum.credits} credits)
            </div>
          </div>
        ) : (
          <Empty text="Click Preview to see your transcript generated from published results." />
        )}
      </Panel>
    </div>
  );
}

/* ───────── CONVOCATION APPLICATION ───────── */
export function StudentConvocation({ enrollments, notify }: Props) {
  const { rows, submit } = useMyRequests('convocation', notify);
  const sum = useMemo(() => summarize(enrollments), [enrollments]);
  const eligible = sum.credits > 0 && sum.cgpa >= 2.0;
  const active = rows.some((r) => r.status !== 'rejected');
  return (
    <div className="space-y-6">
      <Panel title="Convocation Application">
        <Pad>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Your CGPA" value={sum.credits ? sum.cgpa.toFixed(2) : '—'} tone={eligible ? 'emerald' : 'amber'} />
            <Stat label="Eligibility" value={eligible ? 'Eligible' : 'Not yet (CGPA ≥ 2.00)'} tone={eligible ? 'emerald' : 'amber'} />
          </div>
          <button
            disabled={!eligible || active}
            className={`${applyBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
            onClick={() => submit({})}
          >
            <Send className="w-3.5 h-3.5" /> {active ? 'Already Applied' : 'Apply for Convocation'}
          </button>
        </Pad>
      </Panel>
      <Panel title="My Convocation Application">
        <RequestTable rows={rows} />
      </Panel>
    </div>
  );
}
