'use client';

import { useEffect, useState } from 'react';
import {
  getAssociatedStudents,
  getAssociatedStudent,
  getStudentDocuments,
  uploadStudentDocument,
} from '@/services/agentApi';

const AgentStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Academic');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAssociatedStudents();
        setStudents(res.data || []);
        if (res.data?.length) setSelectedId(res.data[0].id);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const loadStudent = async () => {
      try {
        const [sRes, dRes] = await Promise.all([
          getAssociatedStudent(selectedId),
          getStudentDocuments(selectedId),
        ]);
        setStudent(sRes.data);
        setDocuments(dRes.data || []);
      } catch (err) {
        setMessage(err.message);
      }
    };
    loadStudent();
  }, [selectedId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await uploadStudentDocument(selectedId, { name: docName, type: docType });
      const dRes = await getStudentDocuments(selectedId);
      setDocuments(dRes.data || []);
      setDocName('');
      setMessage('Document attached successfully.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading students...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">My students</h1>
        <p className="mt-2 text-sm text-slate-600">
          You can only access student profiles associated with your agent account.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <h2 className="text-xs font-bold uppercase text-slate-500">Associated students</h2>
          <ul className="mt-3 space-y-2">
            {students.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                    selectedId === s.id ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {s.name}
                  <span className="block text-[10px] font-normal text-slate-500">{s.studentId}</span>
                </button>
              </li>
            ))}
            {!students.length && (
              <li className="text-xs text-slate-500">No associated students assigned yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2 space-y-6">
          {student ? (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{student.name}</h2>
                <p className="text-sm text-slate-600">{student.email}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-slate-700">
                  <p><span className="font-semibold">Program:</span> {student.program}</p>
                  <p><span className="font-semibold">University:</span> {student.university}</p>
                  <p><span className="font-semibold">Intake:</span> {student.intake}</p>
                  <p><span className="font-semibold">Status:</span> {student.status}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Student documents</h3>
                <ul className="mt-2 space-y-2">
                  {documents.map((d) => (
                    <li key={d.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-semibold">{d.name}</span> · {d.type}
                    </li>
                  ))}
                  {!documents.length && <li className="text-xs text-slate-500">No documents yet.</li>}
                </ul>

                <form onSubmit={handleUpload} className="mt-4 flex flex-wrap gap-2">
                  <input
                    placeholder="Document name"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    className="flex-1 min-w-[140px] rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option>Academic</option>
                    <option>Identity</option>
                    <option>Financial</option>
                    <option>Visa</option>
                  </select>
                  <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
                    Attach document
                  </button>
                </form>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a student to view details.</p>
          )}
          {message && <p className="text-xs text-slate-600">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default AgentStudents;
