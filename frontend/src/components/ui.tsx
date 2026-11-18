import React from 'react';

export const inputCls =
  'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition';

export function Panel({
  title,
  right,
  dark,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div
        className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-2 ${
          dark ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <h2 className="font-extrabold text-sm">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Pad({ children }: { children: React.ReactNode }) {
  return <div className="p-6 space-y-4">{children}</div>;
}

export function Empty({ text }: { text: string }) {
  return <p className="py-10 px-6 text-center text-sm text-slate-400">{text}</p>;
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            {head.map((h) => (
              <th key={h} className="py-3 px-6 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

const badgeCls: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};
export function Badge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${badgeCls[status] || ''}`}>
      {status}
    </span>
  );
}

export function Stat({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'emerald' | 'amber' }) {
  const tones = { blue: 'text-blue-700', emerald: 'text-emerald-700', amber: 'text-amber-700' };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold mt-1 ${tones[tone]}`}>{value}</div>
    </div>
  );
}

export function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
