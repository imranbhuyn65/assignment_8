'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogOut, Menu, X } from 'lucide-react';
import { EnrollmentRecord, Role, Semester, StudentProfile, TeacherProfile } from '@/types/portal';
import { api, Notify } from '@/lib/api';
import { SEMESTERS } from '@/lib/results';
import * as S from '@/components/student';
import * as T from '@/components/teacher';

const STUDENT_NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'calendar', label: 'Academic Calendar' },
  { id: 'course-reg', label: 'Course Registration' },
  { id: 'clearance', label: 'Registration/Exam Clearance' },
  { id: 'routine', label: 'Routine' },
  { id: 'evaluation', label: 'Teaching Evaluation' },
  { id: 'live-results', label: 'Live Results' },
  { id: 'improvement', label: 'Improvement Apply' },
  { id: 'academic-results', label: 'Academic Results' },
  { id: 'certificates', label: 'Certificates & Transcripts' },
  { id: 'convocation', label: 'Convocation Application' },
];

const TEACHER_NAV = [
  { id: 'catalog', label: 'Course Catalog' },
  { id: 'register', label: 'Register Student Courses' },
  { id: 'marks', label: 'Mark Input (Live Result)' },
  { id: 'calendar', label: 'Academic Calendar' },
  { id: 'routine', label: 'Class Routine' },
  { id: 'requests', label: 'Student Applications' },
  { id: 'evaluations', label: 'Evaluation Reports' },
];

export default function DIUPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('student');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [semester, setSemester] = useState<Semester>(SEMESTERS[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);

  const notify: Notify = useCallback((msg, isError = false) => {
    setToast({ msg, error: isError });
    setTimeout(() => setToast(null), 3600);
  }, []);

  const fetchData = useCallback(async (r: Role) => {
    try {
      if (r === 'student') {
        setEnrollments(await api<EnrollmentRecord[]>('/api/student/enrollments'));
      } else {
        const [sList, eList] = await Promise.all([
          api<StudentProfile[]>('/api/teacher/students'),
          api<EnrollmentRecord[]>('/api/teacher/enrollments'),
        ]);
        setStudents(sList);
        setEnrollments(eList);
      }
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<{ role: Role; user: any }>('/api/auth/me');
        setRole(me.role);
        if (me.role === 'student') {
          setStudent(me.user);
          setActiveTab('dashboard');
        } else {
          setTeacher(me.user);
          setActiveTab('catalog');
        }
        await fetchData(me.role);
        setLoading(false);
      } catch {
        router.push('/');
      }
    })();
  }, [router, fetchData]);

  // Live sync for students every 8s
  useEffect(() => {
    if (role !== 'student') return;
    const id = setInterval(() => fetchData('student'), 8000);
    return () => clearInterval(id);
  }, [role, fetchData]);

  const logout = async () => {
    await api('/api/auth/logout', 'POST').catch(() => undefined);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-white text-sm font-bold">
        Loading DIU Portal...
      </div>
    );
  }

  const nav = role === 'student' ? STUDENT_NAV : TEACHER_NAV;
  const refresh = () => fetchData(role);
  const sp = { semester, enrollments, notify };
  const tp = { ...sp, students, refresh };

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg ${
            toast.error ? 'bg-rose-600' : 'bg-slate-900'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}

      <aside
        className={`fixed md:sticky top-0 h-screen z-40 w-72 bg-[#0B1120] text-slate-300 flex flex-col shrink-0 transition-transform ${
          menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="font-extrabold text-white tracking-tight">DIU Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">{role}</span>
            <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition ${
                activeTab === item.id
                  ? 'bg-blue-600/20 text-white font-semibold border-l-2 border-blue-400'
                  : 'text-slate-400 font-medium hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${activeTab === item.id ? 'bg-blue-400' : 'border border-slate-600'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="truncate">
              <span className="text-xs font-extrabold text-slate-900 hidden sm:inline">Daffodil International University (DIU)</span>
              <span className="text-xs text-slate-500 sm:ml-2">• {role === 'student' ? student?.name : teacher?.name}</span>
            </div>
          </div>
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold shrink-0">
            {SEMESTERS.map((sem) => (
              <button
                key={sem}
                onClick={() => setSemester(sem)}
                className={`px-3 py-1 rounded-lg transition ${semester === sem ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                {sem}
              </button>
            ))}
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">
          {role === 'student' && student && (
            <>
              {activeTab === 'dashboard' && <S.StudentDashboard student={student} {...sp} />}
              {activeTab === 'calendar' && <S.StudentCalendar />}
              {activeTab === 'course-reg' && <S.StudentCourseReg student={student} {...sp} />}
              {activeTab === 'clearance' && <S.StudentClearance student={student} {...sp} />}
              {activeTab === 'routine' && <S.StudentRoutine student={student} {...sp} />}
              {activeTab === 'evaluation' && <S.StudentEvaluation student={student} {...sp} />}
              {activeTab === 'live-results' && <S.StudentLiveResults student={student} {...sp} />}
              {activeTab === 'improvement' && <S.StudentImprovement student={student} {...sp} />}
              {activeTab === 'academic-results' && <S.StudentAcademicResults student={student} {...sp} />}
              {activeTab === 'certificates' && <S.StudentCertificates student={student} {...sp} />}
              {activeTab === 'convocation' && <S.StudentConvocation student={student} {...sp} />}
            </>
          )}

          {role === 'teacher' && (
            <>
              {activeTab === 'catalog' && <T.TeacherCatalog notify={notify} />}
              {activeTab === 'register' && <T.TeacherRegister {...tp} />}
              {activeTab === 'marks' && <T.TeacherMarks {...tp} />}
              {activeTab === 'calendar' && <T.TeacherCalendar notify={notify} />}
              {activeTab === 'routine' && <T.TeacherRoutine semester={semester} notify={notify} />}
              {activeTab === 'requests' && <T.TeacherRequests notify={notify} />}
              {activeTab === 'evaluations' && <T.TeacherEvaluations />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
