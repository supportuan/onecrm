'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { listVisaTracking } from '@/services/studentCrmApi';
import { getVisaStatusLabel, getStageLabel } from '@/features/student-crm/constants';
import { formatDate } from '@/features/student-crm/components/ApplicationParts';

export default function VisaManagementPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVisaTracking();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const term = search.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (!term) return true;
    const app = r.application || {};
    const student = app.student || {};
    return (
      app.applicationCode?.toLowerCase().includes(term) ||
      app.university?.toLowerCase().includes(term) ||
      student.fullName?.toLowerCase().includes(term) ||
      r.country?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg w-full sm:w-64"
            placeholder="Search student or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ui-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-left text-xs text-neutral-500 border-b border-neutral-200">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Application</th>
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">Visa status</th>
                  <th className="px-5 py-3 font-medium">Appointment</th>
                  <th className="px-5 py-3 font-medium">Decision</th>
                  <th className="px-5 py-3 font-medium">App stage</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-neutral-500">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-neutral-500">
                      No visa records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const app = r.application || {};
                    return (
                      <tr key={r.id} className="hover:bg-neutral-50/80">
                        <td className="px-5 py-3">
                          <p className="font-medium text-brand">{app.student?.fullName}</p>
                          <p className="text-xs text-neutral-500">{app.student?.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{app.university}</p>
                          <p className="text-xs text-neutral-500">{app.applicationCode}</p>
                        </td>
                        <td className="px-5 py-3 text-neutral-600">{r.country}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium">
                            {getVisaStatusLabel(r.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-neutral-500">{formatDate(r.appointmentDate)}</td>
                        <td className="px-5 py-3 text-neutral-500">{formatDate(r.decisionDate)}</td>
                        <td className="px-5 py-3 text-xs text-neutral-600">{getStageLabel(app.stage)}</td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/student-crm/applications/${app.id}`}
                            className="text-xs font-medium text-neutral-700 hover:text-brand"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
