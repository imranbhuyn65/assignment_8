import { Router, Response, NextFunction } from 'express';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
import { Course } from '../models/Course';
import { CalendarEvent } from '../models/CalendarEvent';
import { Routine } from '../models/Routine';
import { Evaluation } from '../models/Evaluation';
import { ServiceRequest, REQUEST_KINDS } from '../models/ServiceRequest';
import { requireAuth, requireTeacher, AuthRequest } from '../middleware/auth';
import { calculateUGCGrade, cgpaOf } from '../lib/grading';

const router = Router();

// async error wrapper + student-only guard
const ah = (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
  (req: AuthRequest, res: Response, _next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch((e: any) => res.status(400).json({ error: e.message }));

const studentOnly = (req: AuthRequest, res: Response, next: NextFunction) =>
  requireAuth(req, res, () =>
    req.user?.role === 'student' ? next() : res.status(403).json({ error: 'Student access only' })
  );

/* ───────── COURSE CATALOG (code ↔ name reference) ───────── */
router.get('/courses', requireAuth, ah(async (_req, res) => {
  res.json(await Course.find().sort({ code: 1 }));
}));

router.post('/teacher/courses', requireTeacher, ah(async (req, res) => {
  const { code, title, credit } = req.body;
  if (!code?.trim() || !title?.trim()) {
    return res.status(400).json({ error: 'Course code and course name are required.' });
  }
  try {
    const c = await Course.create({
      code: code.trim(), title: title.trim(), credit: Number(credit) || 3, createdBy: req.user!.name,
    });
    res.status(201).json(c);
  } catch (e: any) {
    if (e.code === 11000) return res.status(409).json({ error: 'This course code already exists.' });
    throw e;
  }
}));

router.delete('/teacher/courses/:id', requireTeacher, ah(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  const used = await Enrollment.countDocuments({ courseCode: course.code });
  if (used > 0) return res.status(409).json({ error: `Cannot delete: ${used} student registration(s) use this course.` });
  await course.deleteOne();
  res.json({ success: true });
}));

/* ───────── ACADEMIC CALENDAR ───────── */
router.get('/calendar', requireAuth, ah(async (_req, res) => {
  res.json(await CalendarEvent.find().sort({ date: 1 }));
}));

router.post('/teacher/calendar', requireTeacher, ah(async (req, res) => {
  const { title, date, type, note } = req.body;
  if (!title?.trim() || !date) return res.status(400).json({ error: 'Title and date are required.' });
  const ev = await CalendarEvent.create({ title: title.trim(), date, type, note, createdBy: req.user!.name });
  res.status(201).json(ev);
}));

router.delete('/teacher/calendar/:id', requireTeacher, ah(async (req, res) => {
  await CalendarEvent.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

/* ───────── CLASS ROUTINE ───────── */
router.get('/routine', requireAuth, ah(async (req, res) => {
  const semester = String(req.query.semester || '');
  const filter: Record<string, any> = semester ? { semester } : {};
  if (req.user!.role === 'student') {
    const codes = await Enrollment.find({ studentId: req.user!.id, ...(semester ? { semester } : {}) }).distinct('courseCode');
    filter.courseCode = { $in: codes };
  }
  res.json(await Routine.find(filter).sort({ startTime: 1 }));
}));

router.post('/teacher/routine', requireTeacher, ah(async (req, res) => {
  const { semester, courseCode, day, startTime, endTime, room } = req.body;
  const course = await Course.findOne({ code: String(courseCode || '').trim().toUpperCase() });
  if (!course) return res.status(404).json({ error: 'Select a course from the catalog.' });
  if (!startTime || !endTime || startTime >= endTime) {
    return res.status(400).json({ error: 'Enter a valid start and end time.' });
  }
  const r = await Routine.create({
    semester, courseCode: course.code, courseTitle: course.title, day, startTime, endTime,
    room: room?.trim() || 'TBA', faculty: req.user!.name,
  });
  res.status(201).json(r);
}));

router.delete('/teacher/routine/:id', requireTeacher, ah(async (req, res) => {
  await Routine.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

/* ───────── TEACHING EVALUATION ───────── */
router.get('/student/evaluations', studentOnly, ah(async (req, res) => {
  res.json(await Evaluation.find({ studentId: req.user!.id }).select('enrollmentId ratings comment'));
}));

router.post('/student/evaluations', studentOnly, ah(async (req, res) => {
  const { enrollmentId, ratings = {}, comment } = req.body;
  const en = await Enrollment.findOne({ _id: enrollmentId, studentId: req.user!.id });
  if (!en) return res.status(404).json({ error: 'Course registration not found.' });
  const clamp = (n: any) => Math.min(5, Math.max(1, Math.round(Number(n) || 0)));
  try {
    await Evaluation.create({
      enrollmentId: String(en._id), studentId: en.studentId, semester: en.semester,
      courseCode: en.courseCode, courseTitle: en.courseTitle, faculty: en.faculty,
      ratings: {
        teaching: clamp(ratings.teaching), clarity: clamp(ratings.clarity),
        punctuality: clamp(ratings.punctuality), support: clamp(ratings.support),
      },
      comment: comment || '',
    });
  } catch (e: any) {
    if (e.code === 11000) return res.status(409).json({ error: 'You already evaluated this course.' });
    throw e;
  }
  res.status(201).json({ success: true });
}));

// Teacher sees only their own evaluations, anonymous (no student IDs)
router.get('/teacher/evaluations', requireTeacher, ah(async (req, res) => {
  const list = await Evaluation.find({ faculty: req.user!.name });
  const groups = new Map<string, any>();
  for (const ev of list) {
    const key = `${ev.semester}|${ev.courseCode}`;
    const g = groups.get(key) || {
      semester: ev.semester, courseCode: ev.courseCode, courseTitle: ev.courseTitle,
      count: 0, sums: { teaching: 0, clarity: 0, punctuality: 0, support: 0 }, comments: [] as string[],
    };
    g.count += 1;
    (Object.keys(g.sums) as (keyof typeof g.sums)[]).forEach((k) => (g.sums[k] += ev.ratings[k]));
    if (ev.comment) g.comments.push(ev.comment);
    groups.set(key, g);
  }
  res.json(
    [...groups.values()].map((g) => {
      const avg = (k: keyof typeof g.sums) => Math.round((g.sums[k] / g.count) * 100) / 100;
      const averages = { teaching: avg('teaching'), clarity: avg('clarity'), punctuality: avg('punctuality'), support: avg('support') };
      const overall = Math.round(((averages.teaching + averages.clarity + averages.punctuality + averages.support) / 4) * 100) / 100;
      return { semester: g.semester, courseCode: g.courseCode, courseTitle: g.courseTitle, count: g.count, averages, overall, comments: g.comments };
    })
  );
}));

/* ───────── STUDENT REQUESTS: clearance / improvement / certificate / convocation ───────── */
const CLEARANCE = ['Registration Clearance', 'Exam Clearance'];
const CERTS = ['Transcript', 'Provisional Certificate', 'Testimonial', 'Grade Sheet'];

router.get('/student/requests', studentOnly, ah(async (req, res) => {
  res.json(await ServiceRequest.find({ studentId: req.user!.id }).sort({ createdAt: -1 }));
}));

router.post('/student/requests', studentOnly, ah(async (req, res) => {
  const { kind, semester = '', enrollmentId = '' } = req.body;
  let detail: string = req.body.detail || '';
  if (!REQUEST_KINDS.includes(kind)) return res.status(400).json({ error: 'Invalid request type.' });

  const student = await Student.findOne({ studentId: req.user!.id });
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  if (kind === 'clearance') {
    if (!CLEARANCE.includes(detail) || !semester) return res.status(400).json({ error: 'Choose a clearance type.' });
  } else if (kind === 'certificate') {
    if (!CERTS.includes(detail)) return res.status(400).json({ error: 'Choose a document type.' });
  } else if (kind === 'improvement') {
    const en = await Enrollment.findOne({ _id: enrollmentId, studentId: student.studentId });
    const g = en && calculateUGCGrade(en.marks);
    if (!en || !g) return res.status(400).json({ error: 'Result is not published for this course.' });
    if (g.point <= 0 || g.point >= 3.0) {
      return res.status(400).json({ error: 'Improvement is allowed only for grades below B (F must be retaken).' });
    }
    detail = `${en.courseCode} — ${en.courseTitle} (current ${g.letter})`;
  } else if (kind === 'convocation') {
    const all = await Enrollment.find({ studentId: student.studentId });
    const { cgpa, credits } = cgpaOf(all);
    if (credits === 0 || cgpa < 2.0) {
      return res.status(400).json({ error: 'You need published results and a CGPA of at least 2.00 to apply.' });
    }
    detail = `Convocation application (CGPA ${cgpa.toFixed(2)})`;
  }

  const dupe = await ServiceRequest.findOne({
    studentId: student.studentId, kind, semester, enrollmentId,
    ...(kind === 'clearance' || kind === 'certificate' ? { detail } : {}),
    status: { $in: ['pending', 'approved'] },
  });
  if (dupe) return res.status(409).json({ error: `You already have a ${dupe.status} request for this.` });

  const created = await ServiceRequest.create({
    studentId: student.studentId, studentName: student.name, kind, detail, semester, enrollmentId,
  });
  res.status(201).json(created);
}));

router.get('/teacher/requests', requireTeacher, ah(async (_req, res) => {
  res.json(await ServiceRequest.find().sort({ createdAt: -1 }));
}));

router.patch('/teacher/requests/:id', requireTeacher, ah(async (req, res) => {
  const { status, remark } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid decision.' });
  const updated = await ServiceRequest.findByIdAndUpdate(
    req.params.id, { status, remark: remark || '', decidedBy: req.user!.name }, { new: true }
  );
  if (!updated) return res.status(404).json({ error: 'Request not found.' });
  res.json(updated);
}));

export default router;
