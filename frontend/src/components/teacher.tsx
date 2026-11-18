'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle, Trash2, UploadCloud, Check, X } from 'lucide-react';
import {
  CalendarEvent,
  Course,
  DAYS,
  EnrollmentRecord,
  EvaluationReport,
  EventType,
  Marks,
  RoutineEntry,
  Semester,
  ServiceRequest,
  StudentProfile,
  previewUGCGrade,
} from '@/types/portal';
import { api, useFetch, Notify } from '@/lib/api';
import { Badge, Empty, Pad, Panel, Table, inputCls } from './ui';
import { CalendarList, RoutineGrid } from './shared';

interface Props {
  semester: Semester;
  enrollments: EnrollmentRecord[];
  students: StudentProfile[];
  refresh: () => Promise<void>;
  notify: Notify;
}

const primaryBtn =
  'py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition';

/* ───────── COURSE CATALOG ───────── */
export function TeacherCatalog({ notify }: Pick<Props, 'notify'>) {
  const { data: courses, reload } = useFetch<Course[]>('/api/courses', []);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [credit, setCredit] = useState(3);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/teacher/courses', 'POST', { code, title, credit });
      setCode('');
      setTitle('');
      await reload();
      notify('Course added to catalog');
    } catch (err: any) {
      notify(err.message, true);
    }
  };
  const remove = async (id: string) => {
    try {
      await api(`/api/teacher/courses/${id}`, 'DELETE');
      await reload();
      notify('Course removed');
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Add Course to Catalog">
        <Pad>
          <p className="text-xs text-slate-500">
            Course code and course name are saved once here. Registration, routine and results all use this reference.
          </p>
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (CSE111)" required className={`${inputCls} uppercase font-bold`} />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course Name" required className={`${inputCls} sm:col-span-3`} />
            <input type="number" step="0.5" min={0.5} max={6} value={credit} onChange={(e) => setCredit(Number(e.target.value))} className={`${inputCls} font-bold`} />
            <button type="submit" className={primaryBtn}>
              <PlusCircle className="w-4 h-4" /> Add
            </button>
          </form>
        </Pad>
      </Panel>
      <Panel title={`Course Catalog (${courses.length})`}>
        {courses.length === 0 ? (
          <Empty text="No courses yet. Add your first course above." />
        ) : (
          <Table head={['Code', 'Course Name', 'Credit', 'Added By', 'Action']}>
            {courses.map((c) => (
              <tr key={c._id}>
                <td className="py-3 px-6 font-mono font-bold text-blue-700">{c.code}</td>
                <td className="py-3 px-6 font-semibold">{c.title}</td>
                <td className="py-3 px-6">{c.credit.toFixed(1)}</td>
                <td className="py-3 px-6 text-slate-500">{c.createdBy}</td>
                <td className="py-3 px-6">
                  <button onClick={() => remove(c._id)} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

/* ───────── REGISTER STUDENT COURSES ───────── */
export function TeacherRegister({ semester, enrollments, students, refresh, notify }: Props) {
  const { data: courses } = useFetch<Course[]>('/api/courses', []);
  const [studentId, setStudentId] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const rows = enrollments.filter((e) => e.semester === semester);
  const picked = courses.find((c) => c.code === courseCode);

  useEffect(() => {
    if (!studentId && students.length) setStudentId(students[0].studentId);
  }, [students, studentId]);
  useEffect(() => {
    if (!courseCode && courses.length) setCourseCode(courses[0].code);
  }, [courses, courseCode]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api('/api/teacher/enrollments', 'POST', { studentId, semester, courseCode });
      await refresh();
      notify(
        studentId === '__ALL__'
          ? `${data.courseCode}: registered ${data.created} student(s), skipped ${data.skipped} already registered`
          : `Registered ${courseCode} for ${studentId} (${semester})`
      );
    } catch (err: any) {
      notify(err.message, true);
    }
  };
  const remove = async (id: string) => {
    await api(`/api/teacher/enrollments/${id}`, 'DELETE');
    await refresh();
    notify('Course registration removed');
  };

  return (
    <div className="space-y-6">
      <Panel title={`Register Course for DIU Student (${semester})`}>
        <Pad>
          {students.length === 0 ? (
            <p className="text-xs text-amber-700 font-semibold">
              No student accounts yet. Ask a student to create an account on the login page first.
            </p>
          ) : courses.length === 0 ? (
            <p className="text-xs text-amber-700 font-semibold">
              Course catalog is empty. Add courses in the Course Catalog tab first.
            </p>
          ) : (
            <form onSubmit={register} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={`${inputCls} sm:col-span-2 font-bold`}>
                <option value="__ALL__">All students ({students.length})</option>
                {students.map((st) => (
                  <option key={st.studentId} value={st.studentId}>
                    {st.studentId} — {st.name}
                  </option>
                ))}
              </select>
              <select value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className={`${inputCls} sm:col-span-3 font-bold`}>
                {courses.map((c) => (
                  <option key={c._id} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
              <button type="submit" className={primaryBtn}>
                <PlusCircle className="w-4 h-4" /> Register
              </button>
              {picked && (
                <p className="sm:col-span-6 text-xs text-slate-500">
                  Selected: <b className="text-blue-700">{picked.code}</b> • {picked.title} • {picked.credit.toFixed(1)} credit
                </p>
              )}
            </form>
          )}
        </Pad>
      </Panel>
      <Panel title={`Registered Courses (${semester})`}>
        {rows.length === 0 ? (
          <Empty text="No registrations for this semester yet." />
        ) : (
          <Table head={['Student ID', 'Code', 'Title', 'Credit', 'Action']}>
            {rows.map((en) => (
              <tr key={en._id}>
                <td className="py-3 px-6 font-mono font-bold">{en.studentId}</td>
                <td className="py-3 px-6 font-mono font-bold text-blue-700">{en.courseCode}</td>
                <td className="py-3 px-6 font-semibold">{en.courseTitle}</td>
                <td className="py-3 px-6">{en.credit.toFixed(1)}</td>
                <td className="py-3 px-6">
                  <button onClick={() => remove(en._id)} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

/* ───────── MARK INPUT (LIVE RESULT) ───────── */
const FIELDS: { key: keyof Marks; max: number }[] = [
  { key: 'attendance', max: 10 },
  { key: 'assignment', max: 15 },
  { key: 'quiz', max: 15 },
  { key: 'midterm', max: 25 },
  { key: 'final', max: 35 },
];

export function TeacherMarks({ semester, enrollments, refresh, notify }: Props) {
  const rows = enrollments.filter((e) => e.semester === semester);
  const [selected, setSelected] = useState('');
  const [marks, setMarks] = useState<Marks>({ attendance: 0, assignment: 0, quiz: 0, midterm: 0, final: 0 });

  useEffect(() => {
    if (!rows.some((r) => r._id === selected)) setSelected(rows[0]?._id || '');
  }, [rows, selected]);
  // load saved marks when switching record
  useEffect(() => {
    const en = rows.find((r) => r._id === selected);
    setMarks(en?.marks || { attendance: 0, assignment: 0, quiz: 0, midterm: 0, final: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const preview = previewUGCGrade(marks);
  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/api/teacher/enrollments/${selected}/marks`, 'PATCH', marks);
      await refresh();
      notify('Live result published to student portal!');
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  return (
    <Panel title={`Publish Live Marks (${semester})`}>
      <Pad>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">No courses registered for {semester} yet. Register a course first.</p>
        ) : (
          <>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} className={`${inputCls} font-bold`}>
              {rows.map((en) => (
                <option key={en._id} value={en._id}>
                  {en.studentId} • {en.courseCode} — {en.courseTitle} {en.published ? '✓' : ''}
                </option>
              ))}
            </select>
            <form onSubmit={publish} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {FIELDS.map(({ key, max }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      {key} (max {max})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={max}
                      value={marks[key]}
                      onChange={(e) => setMarks((p) => ({ ...p, [key]: Number(e.target.value) }))}
                      className={`${inputCls} font-bold text-center`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-900 text-white px-5 py-3.5 rounded-xl">
                <div className="text-xs font-bold">
                  Total: <span className="text-amber-300 text-sm">{preview.total}/100</span> • Grade:{' '}
                  <span className="text-emerald-400 text-sm">
                    {preview.letter} ({preview.point.toFixed(2)})
                  </span>
                </div>
                <button type="submit" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase rounded-xl flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" /> Publish Live Result
                </button>
              </div>
            </form>
          </>
        )}
      </Pad>
    </Panel>
  );
}

/* ───────── ACADEMIC CALENDAR (manage) ───────── */
export function TeacherCalendar({ notify }: Pick<Props, 'notify'>) {
  const { data, reload } = useFetch<CalendarEvent[]>('/api/calendar', []);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('Event');
  const [note, setNote] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/teacher/calendar', 'POST', { title, date, type, note });
      setTitle('');
      setNote('');
      await reload();
      notify('Event added to academic calendar');
    } catch (err: any) {
      notify(err.message, true);
    }
  };
  const remove = async (id: string) => {
    await api(`/api/teacher/calendar/${id}`, 'DELETE');
    await reload();
  };

  return (
    <div className="space-y-6">
      <Panel title="Add Calendar Event">
        <Pad>
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" required className={`${inputCls} sm:col-span-2`} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
            <select value={type} onChange={(e) => setType(e.target.value as EventType)} className={inputCls}>
              {(['Class', 'Exam', 'Holiday', 'Deadline', 'Event'] as EventType[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={inputCls} />
            <button type="submit" className={primaryBtn}>
              <PlusCircle className="w-4 h-4" /> Add
            </button>
          </form>
        </Pad>
      </Panel>
      <Panel title="Academic Calendar">
        <CalendarList events={data} onDelete={remove} />
      </Panel>
    </div>
  );
}

/* ───────── CLASS ROUTINE (manage) ───────── */
export function TeacherRoutine({ semester, notify }: Pick<Props, 'semester' | 'notify'>) {
  const { data: courses } = useFetch<Course[]>('/api/courses', []);
  const { data, reload } = useFetch<RoutineEntry[]>(`/api/routine?semester=${encodeURIComponent(semester)}`, []);
  const [courseCode, setCourseCode] = useState('');
  const [day, setDay] = useState<string>('Saturday');
  const [startTime, setStart] = useState('09:00');
  const [endTime, setEnd] = useState('10:30');
  const [room, setRoom] = useState('');

  useEffect(() => {
    if (!courseCode && courses.length) setCourseCode(courses[0].code);
  }, [courses, courseCode]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/teacher/routine', 'POST', { semester, courseCode, day, startTime, endTime, room });
      await reload();
      notify('Class added to routine');
    } catch (err: any) {
      notify(err.message, true);
    }
  };
  const remove = async (id: string) => {
    await api(`/api/teacher/routine/${id}`, 'DELETE');
    await reload();
  };

  return (
    <div className="space-y-6">
      <Panel title={`Add Class to Routine (${semester})`}>
        <Pad>
          {courses.length === 0 ? (
            <p className="text-xs text-amber-700 font-semibold">Add courses to the catalog first.</p>
          ) : (
            <form onSubmit={add} className="grid grid-cols-2 sm:grid-cols-7 gap-3">
              <select value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className={`${inputCls} col-span-2 sm:col-span-2 font-bold`}>
                {courses.map((c) => (
                  <option key={c._id} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} className={inputCls}>
                {DAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <input type="time" value={startTime} onChange={(e) => setStart(e.target.value)} required className={inputCls} />
              <input type="time" value={endTime} onChange={(e) => setEnd(e.target.value)} required className={inputCls} />
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" className={inputCls} />
              <button type="submit" className={primaryBtn}>
                <PlusCircle className="w-4 h-4" /> Add
              </button>
            </form>
          )}
        </Pad>
      </Panel>
      <Panel title={`Class Routine — ${semester}`}>
        <RoutineGrid entries={data} onDelete={remove} />
      </Panel>
    </div>
  );
}

/* ───────── STUDENT REQUESTS INBOX ───────── */
const KIND_LABEL: Record<string, string> = {
  clearance: 'Clearance',
  improvement: 'Improvement',
  certificate: 'Certificate',
  convocation: 'Convocation',
};

export function TeacherRequests({ notify }: Pick<Props, 'notify'>) {
  const { data, reload } = useFetch<ServiceRequest[]>('/api/teacher/requests', []);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const list = data.filter((r) => filter === 'all' || r.status === filter);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api(`/api/teacher/requests/${id}`, 'PATCH', { status });
      await reload();
      notify(`Request ${status}`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  return (
    <Panel
      title="Student Applications"
      right={
        <div className="bg-slate-200/70 p-1 rounded-xl flex text-xs font-bold">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg capitalize transition ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      {list.length === 0 ? (
        <Empty text={`No ${filter === 'all' ? '' : filter} applications.`} />
      ) : (
        <Table head={['Student', 'Type', 'Details', 'Status', 'Action']}>
          {list.map((r) => (
            <tr key={r._id}>
              <td className="py-3 px-6">
                <div className="font-bold">{r.studentName}</div>
                <div className="text-xs font-mono text-slate-500">{r.studentId}</div>
              </td>
              <td className="py-3 px-6 font-semibold">{KIND_LABEL[r.kind]}</td>
              <td className="py-3 px-6 text-slate-600">
                {r.detail}
                {r.semester && <span className="text-slate-400"> • {r.semester}</span>}
              </td>
              <td className="py-3 px-6">
                <Badge status={r.status} />
              </td>
              <td className="py-3 px-6">
                {r.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => decide(r._id, 'approved')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => decide(r._id, 'rejected')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">By {r.decidedBy}</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

/* ───────── EVALUATION REPORTS ───────── */
export function TeacherEvaluations() {
  const { data } = useFetch<EvaluationReport[]>('/api/teacher/evaluations', []);
  return (
    <Panel title="Teaching Evaluation Reports (anonymous)">
      {data.length === 0 ? (
        <Empty text="No evaluations received for your courses yet." />
      ) : (
        <div className="p-6 grid gap-4 md:grid-cols-2">
          {data.map((g) => (
            <div key={`${g.semester}-${g.courseCode}`} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm">
                    <span className="text-blue-700">{g.courseCode}</span> — {g.courseTitle}
                  </div>
                  <div className="text-xs text-slate-500">
                    {g.semester} • {g.count} response{g.count > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-amber-500">{g.overall.toFixed(2)}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>Teaching: <b>{g.averages.teaching}</b></div>
                <div>Clarity: <b>{g.averages.clarity}</b></div>
                <div>Punctuality: <b>{g.averages.punctuality}</b></div>
                <div>Support: <b>{g.averages.support}</b></div>
              </div>
              {g.comments.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                  {g.comments.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
