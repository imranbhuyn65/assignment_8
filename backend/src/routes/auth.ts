import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'diu_portal_jwt_secret_2026';

function setSessionCookie(res: Response, payload: { id: string; role: 'student' | 'teacher'; name: string }) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('diu_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// STUDENT SELF-REGISTRATION (No fixed accounts)
router.post('/student/register', async (req: Request, res: Response) => {
  try {
    const { studentId, regNo, name, program, batch, email, phone, campus, dob, gender, bloodGroup, password } = req.body;
    if (!studentId || !name || !email || !password) {
      return res.status(400).json({ error: 'Student ID, Name, Email, and Password are required.' });
    }
    const exists = await Student.findOne({ $or: [{ studentId }, { email: email.toLowerCase() }] });
    if (exists) {
      return res.status(409).json({ error: 'A student with this ID or Email already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const student = await Student.create({
      studentId: studentId.trim(),
      regNo: regNo?.trim() || '024' + studentId.replace(/[^0-9]/g, ''),
      name: name.trim(),
      university: 'Daffodil International University (DIU)',
      program: program || 'B.Sc. in Computer Science & Engineering',
      batch: batch?.trim() || '65',
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '01700000000',
      campus: campus || 'DSC',
      dob: dob || 'Oct 10, 2004',
      gender: gender || 'Male',
      bloodGroup: bloodGroup || 'O+',
      status: 'Active',
      passwordHash,
    });

    setSessionCookie(res, { id: student.studentId, role: 'student', name: student.name });
    const safeStudent = student.toObject();
    delete (safeStudent as any).passwordHash;
    res.status(201).json({ role: 'student', user: safeStudent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// STUDENT LOGIN
router.post('/student/login', async (req: Request, res: Response) => {
  try {
    const { studentId, password } = req.body;
    const student = await Student.findOne({ studentId: studentId?.trim() });
    if (!student) {
      return res.status(404).json({ error: 'Student account not found. Please create an account first.' });
    }
    const ok = await bcrypt.compare(password || '', student.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    setSessionCookie(res, { id: student.studentId, role: 'student', name: student.name });
    const safeStudent = student.toObject();
    delete (safeStudent as any).passwordHash;
    res.json({ role: 'student', user: safeStudent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TEACHER SELF-REGISTRATION (No fixed accounts)
router.post('/teacher/register', async (req: Request, res: Response) => {
  try {
    const { name, email, designation, department, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, Email, and Password are required.' });
    }
    const exists = await Teacher.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'A teacher with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const teacher = await Teacher.create({
      teacherId: 'DIU-T-' + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      university: 'Daffodil International University (DIU)',
      designation: designation?.trim() || 'Faculty Advisor',
      department: department?.trim() || 'Department of CSE',
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    setSessionCookie(res, { id: teacher.teacherId, role: 'teacher', name: teacher.name });
    const safeTeacher = teacher.toObject();
    delete (safeTeacher as any).passwordHash;
    res.status(201).json({ role: 'teacher', user: safeTeacher });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TEACHER LOGIN
router.post('/teacher/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email: email?.trim().toLowerCase() });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher account not found. Please create an account first.' });
    }
    const ok = await bcrypt.compare(password || '', teacher.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    setSessionCookie(res, { id: teacher.teacherId, role: 'teacher', name: teacher.name });
    const safeTeacher = teacher.toObject();
    delete (safeTeacher as any).passwordHash;
    res.json({ role: 'teacher', user: safeTeacher });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET CURRENT SESSION
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'student') {
    const student = await Student.findOne({ studentId: req.user.id }).select('-passwordHash');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json({ role: 'student', user: student });
  }
  const teacher = await Teacher.findOne({ teacherId: req.user?.id }).select('-passwordHash');
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  return res.json({ role: 'teacher', user: teacher });
});

// LOGOUT
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('diu_token');
  res.json({ success: true });
});

export default router;
