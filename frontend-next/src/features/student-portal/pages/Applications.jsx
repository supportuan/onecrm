'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, FileText, ChevronRight } from 'lucide-react';
import { getMyStudent, listMyApplications } from '@/services/studentCrmApi';
import { PROCESS_STAGES, STAGE_LABELS } from '../constants';

const docProgress = (app) => {
  const docs = app.documents || [];
  const required = docs.filter((d) => d.required);
  const done = required.filter((d) => ['UPLOADED', 'VERIFIED'].includes(d.status)).length;
  const rejected = docs.filter((d) => d.status === 'REJECTED').length;
  return { required: required.length, done, rejected };
};

export default function ApplicationsPage() {
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyStudent(), listMyApplications()])
      .then(([pRes, aRes]) => {
        setProfile(pRes?.data || null);
        setApps(Array.isArray(aRes?.data) ? aRes.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentIdx = PROCESS_STAGES.indexOf(profile?.processStage || '');

  if (loading) return <p className="text-sm text-neutral-500">Loading application…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My application</h1>
        <p className="text-sm text-neutral-500 mt-1">Track your progress through each stage of the journey.</p>
      </div>

      <section className="ui-panel p-5">
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Application journey</h2>
        <ol className="space-y-2">
          {PROCESS_STAGES.map((stage, idx) => {
            const done = currentIdx > idx;
            const active = profile?.processStage === stage;
            return (
              <li
                key={stage}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-neutral-200 bg-white text-neutral-600'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-neutral-300'}`} />
                )}
                <div className="flex-1">
                  <span className="font-medium">{idx + 1}. {STAGE_LABELS[stage]}</span>
                  {active && profile && (
                    <p className={`text-xs mt-0.5 ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {profile.completedCheckList} of {profile.totalCheckList} checklist items complete
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="ui-panel overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">University applications</h2>
        </div>
        {apps.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No applications linked yet. Your counsellor will add these.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">University</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Documents</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {apps.map((a) => {
                  const { required, done, rejected } = docProgress(a);
                  return (
                  <tr key={a.id} className="hover:bg-neutral-50/80">
                    <td className="px-5 py-3 font-medium">{a.applicationCode}</td>
                    <td className="px-5 py-3">{a.university}</td>
                    <td className="px-5 py-3 text-neutral-600">{a.course}</td>
                    <td className="px-5 py-3 text-neutral-600">{a.country}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                        {a.stage}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <FileText size={12} className="text-neutral-400" />
                        {required > 0 ? (
                          <span>
                            {done}/{required} uploaded
                            {rejected > 0 && (
                              <span className="text-rose-600 ml-1">· {rejected} rejected</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-neutral-400">No checklist yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/applicant/applications/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900"
                      >
                        Manage docs <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
