import { Router, Response } from 'express';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
import { Course } from '../models/Course';
import { requireAuth, requireTeacher, AuthRequest } from '../middleware/auth';
import { calculateUGCGrade } from '../lib/grading';

const router = Router();

// STUDENT: Get own enrollments & live results
router.get('/student/enrollments', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ error: 'Student access only' });
  }
  const records = await Enrollment.find({ studentId: req.user.id }).sort({ createdAt: 1 });
  const enriched = records.map((doc) => {
    const obj = doc.toObject();
    return {
      ...obj,
      grade: calculateUGCGrade(obj.marks),
    };
  });
  res.json(enriched);
});

// TEACHER: List all registered DIU students
router.get('/teacher/students', requireTeacher, async (_req: AuthRequest, res: Response) => {
  const students = await Student.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json(students);
});

// TEACHER: List all enrollments (optionally filtered by semester)
router.get('/teacher/enrollments', requireTeacher, async (req: AuthRequest, res: Response) => {
  const filter: Record<string, any> = {};
  if (req.query.semester) {
    filter.semester = req.query.semester;
  }
  const records = await Enrollment.find(filter).sort({ createdAt: -1 });
  const enriched = records.map((doc) => {
    const obj = doc.toObject();
    return {
      ...obj,
      grade: calculateUGCGrade(obj.marks),
    };
  });
  res.json(enriched);
});

// TEACHER-EXCLUSIVE: Register a catalog course for one student (or all students with studentId "__ALL__")
router.post('/teacher/enrollments', requireTeacher, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, semester, courseCode } = req.body;
    if (!studentId || !semester || !courseCode) {
      return res.status(400).json({ error: 'Student, Semester and Course are required.' });
    }
    // Course code <-> course name come from the catalog (single source of truth)
    const course = await Course.findOne({ code: String(courseCode).trim().toUpperCase() });
    if (!course) {
      return res.status(404).json({ error: 'Course not found. Add it in Course Catalog first.' });
    }

    const base = {
      semester,
      courseCode: course.code,
      courseTitle: course.title,
      credit: course.credit,
      faculty: req.user!.name,
      registeredBy: req.user!.name,
      marks: null,
      published: false,
    };

    if (studentId === '__ALL__') {
      const all = await Student.find().select('studentId');
      let created = 0;
      for (const st of all) {
        try {
          await Enrollment.create({ ...base, studentId: st.studentId });
          created++;
        } catch (err: any) {
          if (err.code !== 11000) throw err;
        }
      }
      return res.status(201).json({ created, skipped: all.length - created, courseCode: course.code });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ error: 'Selected student not found.' });
    }
    const created = await Enrollment.create({ ...base, studentId });
    res.status(201).json({ ...created.toObject(), grade: null });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Student is already registered in this course for this semester.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// TEACHER-EXCLUSIVE: Input / Publish Live Marks
router.patch('/teacher/enrollments/:id/marks', requireTeacher, async (req: AuthRequest, res: Response) => {
  try {
    const attendance = Math.min(10, Math.max(0, Number(req.body.attendance) || 0));
    const assignment = Math.min(15, Math.max(0, Number(req.body.assignment) || 0));
    const quiz = Math.min(15, Math.max(0, Number(req.body.quiz) || 0));
    const midterm = Math.min(25, Math.max(0, Number(req.body.midterm) || 0));
    const final = Math.min(35, Math.max(0, Number(req.body.final) || 0));

    const updated = await Enrollment.findByIdAndUpdate(
      req.params.id,
      {
        marks: { attendance, assignment, quiz, midterm, final },
        published: true,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Enrollment record not found.' });
    }

    const obj = updated.toObject();
    res.json({ ...obj, grade: calculateUGCGrade(obj.marks) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// TEACHER-EXCLUSIVE: Remove student course registration
router.delete('/teacher/enrollments/:id', requireTeacher, async (req: AuthRequest, res: Response) => {
  await Enrollment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
