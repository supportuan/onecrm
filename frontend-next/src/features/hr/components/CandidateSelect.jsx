'use client';

import { useEffect, useState } from 'react';
import { getCandidates } from '@/services/hrApi';

/** Dropdown to pick an active pipeline candidate (optionally filtered by job). */
export default function CandidateSelect({ value, onChange, jobId, className = '' }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getCandidates(jobId || undefined);
        if (!cancelled && res.success) setCandidates(res.data || []);
      } catch {
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return (
    <select
      value={value}
      onChange={(e) => {
        const id = e.target.value;
        const c = candidates.find((x) => x.id === id);
        onChange(id, c);
      }}
      disabled={loading}
      className={className || 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm'}
    >
      <option value="">{loading ? 'Loading candidates…' : 'Select candidate'}</option>
      {candidates.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} — {c.email} ({c.currentStage.replace(/_/g, ' ')})
        </option>
      ))}
    </select>
  );
}
