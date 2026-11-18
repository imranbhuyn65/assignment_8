import React from 'react';
import { Trash2 } from 'lucide-react';
import { CalendarEvent, DAYS, EventType, RoutineEntry, ServiceRequest } from '@/types/portal';
import { Badge, Empty, Table, fmtDate } from './ui';

const typeCls: Record<EventType, string> = {
  Class: 'bg-blue-50 text-blue-700',
  Exam: 'bg-rose-50 text-rose-700',
  Holiday: 'bg-emerald-50 text-emerald-700',
  Deadline: 'bg-amber-50 text-amber-700',
  Event: 'bg-violet-50 text-violet-700',
};

export function CalendarList({ events, onDelete }: { events: CalendarEvent[]; onDelete?: (id: string) => void }) {
  if (events.length === 0) return <Empty text="No calendar events yet." />;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((ev) => (
        <li key={ev._id} className={`px-6 py-3.5 flex items-center gap-4 ${ev.date < today ? 'opacity-50' : ''}`}>
          <div className="w-14 shrink-0 text-center rounded-xl bg-slate-900 text-white py-1.5">
            <div className="text-lg font-extrabold leading-none">{ev.date.slice(8, 10)}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
              {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-slate-900 truncate">{ev.title}</div>
            <div className="text-xs text-slate-500">
              {fmtDate(ev.date)}
              {ev.note ? ` • ${ev.note}` : ''}
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${typeCls[ev.type]}`}>{ev.type}</span>
          {onDelete && (
            <button onClick={() => onDelete(ev._id)} className="text-rose-600 hover:text-rose-700" aria-label="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RoutineGrid({ entries, onDelete }: { entries: RoutineEntry[]; onDelete?: (id: string) => void }) {
  const days = DAYS.filter((d) => entries.some((e) => e.day === d));
  if (days.length === 0) return <Empty text="No class routine for this semester yet." />;
  return (
    <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {days.map((day) => (
        <div key={day} className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider">{day}</div>
          <div className="divide-y divide-slate-100">
            {entries
              .filter((e) => e.day === day)
              .map((e) => (
                <div key={e._id} className="px-4 py-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-blue-700">
                      {e.startTime} – {e.endTime}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{e.courseCode}</div>
                    <div className="text-xs text-slate-500">
                      {e.courseTitle} • Room {e.room}
                    </div>
                    <div className="text-[11px] text-slate-400">{e.faculty}</div>
                  </div>
                  {onDelete && (
                    <button onClick={() => onDelete(e._id)} className="text-rose-600" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RequestTable({ rows }: { rows: ServiceRequest[] }) {
  if (rows.length === 0) return <Empty text="No applications yet." />;
  return (
    <Table head={['Date', 'Application', 'Status', 'Remark']}>
      {rows.map((r) => (
        <tr key={r._id}>
          <td className="py-3 px-6 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
          <td className="py-3 px-6 font-semibold">
            {r.detail}
            {r.semester && <span className="text-slate-400 font-normal"> • {r.semester}</span>}
          </td>
          <td className="py-3 px-6">
            <Badge status={r.status} />
          </td>
          <td className="py-3 px-6 text-slate-500">{r.remark || (r.decidedBy ? `By ${r.decidedBy}` : '—')}</td>
        </tr>
      ))}
    </Table>
  );
}
