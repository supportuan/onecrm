'use client';

import { useEffect, useState } from 'react';
import { contactUniversityPoc, getUniversityPocs } from '@/services/agentApi';

const AgentUniversityPoc = () => {
  const [pocs, setPocs] = useState([]);
  const [selectedPoc, setSelectedPoc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUniversityPocs();
        setPocs(res.data || []);
        if (res.data?.length) setSelectedPoc(res.data[0].id);
      } catch (err) {
        setStatus(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleContact = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await contactUniversityPoc(selectedPoc, { subject, message });
      setStatus(`Message sent to ${res.data?.poc?.name} at ${res.data?.poc?.university}.`);
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus(err.message);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading university contacts...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">University POC</h1>
        <p className="mt-2 text-sm text-slate-600">
          Contact university points of contact for your associated students only.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Available contacts</h2>
          <ul className="mt-4 space-y-3">
            {pocs.map((poc) => (
              <li
                key={poc.id}
                className={`rounded-xl border p-4 cursor-pointer ${
                  selectedPoc === poc.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-slate-50'
                }`}
                onClick={() => setSelectedPoc(poc.id)}
              >
                <p className="text-sm font-semibold text-slate-900">{poc.name}</p>
                <p className="text-xs text-slate-600">{poc.role} · {poc.university}</p>
                <p className="text-xs text-slate-500 mt-1">{poc.email} · {poc.phone}</p>
              </li>
            ))}
            {!pocs.length && <li className="text-xs text-slate-500">No POCs linked to your students.</li>}
          </ul>
        </div>

        <form onSubmit={handleContact} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Send message</h2>
          <div>
            <label className="text-xs font-semibold text-slate-600">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">
            Contact POC
          </button>
          {status && <p className="text-xs text-slate-600">{status}</p>}
        </form>
      </div>
    </div>
  );
};

export default AgentUniversityPoc;
