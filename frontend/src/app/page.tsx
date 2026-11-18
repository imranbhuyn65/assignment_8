'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Lock, Mail, IdCard, ArrowRight, UserPlus, User, Phone, Hash, Eye, EyeOff,
  Briefcase, Building2, BookOpen, BarChart3, FileText, CalendarDays, Loader2, Droplet, type LucideIcon,
} from 'lucide-react';

type Role = 'student' | 'teacher';

const ACCENT = {
  student: {
    btn: 'from-blue-500 to-indigo-600 shadow-blue-600/30',
    ring: 'focus-within:ring-blue-400/60',
    text: 'text-blue-300',
    pill: 'bg-blue-500',
  },
  teacher: {
    btn: 'from-emerald-500 to-teal-600 shadow-emerald-600/30',
    ring: 'focus-within:ring-emerald-400/60',
    text: 'text-emerald-300',
    pill: 'bg-emerald-500',
  },
} as const;

function Field({
  icon: Icon, accent, right, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon; accent: Role; right?: React.ReactNode }) {
  return (
    <label
      className={`flex items-center gap-3 px-4 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus-within:ring-2 focus-within:bg-white/[0.08] transition ${ACCENT[accent].ring}`}
    >
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        {...props}
        className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
      />
      {right}
    </label>
  );
}

const FEATURES = [
  { icon: BarChart3, title: 'Live results & CGPA', text: 'Marks sync the moment your teacher publishes them.' },
  { icon: BookOpen, title: 'Course registration', text: 'Courses linked to the official course catalog.' },
  { icon: CalendarDays, title: 'Calendar & routine', text: 'Never miss a class, exam or deadline.' },
  { icon: FileText, title: 'Transcripts & certificates', text: 'Apply online, track every approval.' },
];

export default function AuthPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('student');
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [f, setF] = useState({
    studentId: '', regNo: '', name: '', batch: '', phone: '', bloodGroup: 'O+',
    email: '', designation: '', department: '', password: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const a = ACCENT[role];

  const switchRole = (r: Role) => { setRole(r); setError(''); };
  const switchMode = () => { setRegister((v) => !v); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = `/api/auth/${role}/${register ? 'register' : 'login'}`;
      const body =
        role === 'student'
          ? register
            ? { studentId: f.studentId, regNo: f.regNo, name: f.name, batch: f.batch, email: f.email, phone: f.phone, bloodGroup: f.bloodGroup, password: f.password }
            : { studentId: f.studentId, password: f.password }
          : register
          ? { name: f.name, email: f.email, designation: f.designation, department: f.department, password: f.password }
          : { email: f.email, password: f.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      router.push('/portal');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const pwToggle = (
    <button type="button" onClick={() => setShowPw((v) => !v)} className="text-slate-400 hover:text-white" aria-label="Toggle password">
      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-[#060A14]">
      {/* LEFT: brand panel */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden p-14 text-white bg-gradient-to-br from-blue-700 via-indigo-800 to-[#0B1120]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-sky-400/30 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold tracking-tight">Daffodil International University</div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-200">DIU Academic Portal</div>
          </div>
        </div>

        <div className="relative max-w-lg animate-rise">
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
            Your whole campus,
            <br />
            <span className="bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent">in one place.</span>
          </h1>
          <p className="mt-5 text-blue-100/80 text-lg">
            One portal for students and teachers: results, registration, routine and more.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4">
                <Icon className="w-5 h-5 text-sky-200" />
                <div className="mt-2 text-sm font-bold">{title}</div>
                <div className="mt-0.5 text-xs text-blue-100/70">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-blue-200/70">© {new Date().getFullYear()} Daffodil International University</div>
      </section>

      {/* RIGHT: form */}
      <section className="relative flex items-center justify-center p-5 sm:p-10 overflow-hidden">
        <div className={`absolute -bottom-32 -right-20 w-96 h-96 rounded-full blur-3xl opacity-25 ${a.pill}`} />

        <div className="relative w-full max-w-md animate-rise">
          {/* mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 text-white">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="font-extrabold leading-tight">
              DIU Academic Portal
              <div className="text-[11px] font-semibold text-slate-400">Daffodil International University</div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl p-7 sm:p-8">
            {/* role switch */}
            <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-black/30 border border-white/5 mb-7">
              <span
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ${a.pill} ${
                  role === 'student' ? 'left-1' : 'left-[calc(50%+2px)]'
                }`}
              />
              {(['student', 'teacher'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchRole(r)}
                  className={`relative z-10 h-10 rounded-xl text-sm font-bold capitalize flex items-center justify-center gap-2 transition-colors ${
                    role === r ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r === 'student' ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  {r}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {register ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              {register
                ? `Set up your ${role} account in a minute.`
                : `Sign in to your ${role} portal to continue.`}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5" key={`${role}-${register}`}>
              {/* STUDENT */}
              {role === 'student' && !register && (
                <Field accent={role} icon={IdCard} value={f.studentId} onChange={set('studentId')} placeholder="Student ID (e.g. 232-15-498)" required />
              )}
              {role === 'student' && register && (
                <>
                  <Field accent={role} icon={User} value={f.name} onChange={set('name')} placeholder="Full name" required />
                  <div className="grid grid-cols-2 gap-3">
                    <Field accent={role} icon={IdCard} value={f.studentId} onChange={set('studentId')} placeholder="Student ID" required />
                    <Field accent={role} icon={Hash} value={f.batch} onChange={set('batch')} placeholder="Batch (65)" required />
                  </div>
                  <Field accent={role} icon={Hash} value={f.regNo} onChange={set('regNo')} placeholder="Registration no." required />
                  <Field accent={role} icon={Mail} type="email" value={f.email} onChange={set('email')} placeholder="DIU email (@diu.edu.bd)" required />
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Field accent={role} icon={Phone} value={f.phone} onChange={set('phone')} placeholder="Phone number" required />
                    <label className={`flex items-center gap-2 px-3 h-12 rounded-xl bg-white/5 border border-white/10 focus-within:ring-2 ${a.ring}`}>
                      <Droplet className="w-4 h-4 text-rose-400" />
                      <select value={f.bloodGroup} onChange={set('bloodGroup')} className="bg-transparent text-sm text-white outline-none [&>option]:text-slate-900">
                        {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              )}

              {/* TEACHER */}
              {role === 'teacher' && register && (
                <>
                  <Field accent={role} icon={User} value={f.name} onChange={set('name')} placeholder="Full name" required />
                  <div className="grid grid-cols-2 gap-3">
                    <Field accent={role} icon={Briefcase} value={f.designation} onChange={set('designation')} placeholder="Designation" required />
                    <Field accent={role} icon={Building2} value={f.department} onChange={set('department')} placeholder="Department" required />
                  </div>
                </>
              )}
              {role === 'teacher' && (
                <Field accent={role} icon={Mail} type="email" value={f.email} onChange={set('email')} placeholder="DIU faculty email" required />
              )}

              <Field
                accent={role}
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                value={f.password}
                onChange={set('password')}
                placeholder={register ? 'Create password' : 'Password'}
                required
                right={pwToggle}
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 mt-2 rounded-xl bg-gradient-to-r ${a.btn} text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-70 transition flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : register ? (
                  <UserPlus className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {loading ? 'Please wait...' : register ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              {register ? 'Already have an account?' : 'New here?'}{' '}
              <button type="button" onClick={switchMode} className={`font-bold ${a.text} hover:underline`}>
                {register ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
