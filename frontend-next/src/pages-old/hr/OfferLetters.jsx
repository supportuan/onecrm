'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Plus, Send, CheckCircle2, XCircle, Clock, AlertCircle,
  DollarSign, Calendar, User, X, Save, ChevronDown
} from 'lucide-react';
import { getOfferLetters, createOfferLetter, updateOfferLetterStatus } from '../../services/hrApi';

const STATUS_META = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: Clock },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

const POLICY_TEMPLATES = [
  { value: 'standard', label: 'Standard FTE' },
  { value: 'senior', label: 'Senior / Lead' },
  { value: 'contract', label: 'Contractor' },
  { value: 'intern', label: 'Intern' },
];

const STATUS_TRANSITIONS = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

const emptyForm = {
  candidateId: '', candidateName: '', candidateEmail: '', jobTitle: '',
  department: '', offeredSalary: '', joiningDate: '', expiryDate: '',
  status: 'DRAFT', policyTemplate: 'standard',
};

export default function OfferLetters() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => { fetchLetters(); }, []);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const res = await getOfferLetters();
      if (res.success) setLetters(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.candidateName || !form.candidateEmail || !form.jobTitle || !form.offeredSalary) return;
    setSubmitting(true);
    try {
      const res = await createOfferLetter({ ...form, offeredSalary: Number(form.offeredSalary) });
      if (res.success) {
        setLetters(prev => [res.data, ...prev]);
        setShowModal(false);
        setForm(emptyForm);
        flash('Offer letter created successfully');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await updateOfferLetterStatus(id, status);
      if (res.success) {
        setLetters(prev => prev.map(l => l.id === id ? res.data : l));
        flash(`Offer letter marked as ${status.toLowerCase()}`);
      }
    } catch (e) { console.error(e); }
  };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const filtered = filterStatus === 'ALL' ? letters : letters.filter(l => l.status === filterStatus);

  const formatCurrency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 w-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Offer Letters
          </h1>
          <p className="text-sm text-gray-500 mt-1">Generate and track policy-compliant offer letters</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Generate Offer
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_META).map(([status, meta]) => {
          const count = letters.filter(l => l.status === status).length;
          const Icon = meta.icon;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? 'ALL' : status)}
              className={`rounded-xl p-3 text-left border transition-all ${filterStatus === status ? 'ring-2 ring-offset-1 ring-indigo-400 border-indigo-200' : 'border-gray-100 hover:border-gray-200'} bg-white shadow-sm`}
            >
              <Icon className={`w-4 h-4 mb-1 ${meta.color.split(' ')[1]}`} />
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading offer letters...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Candidate', 'Role / Department', 'Offered Salary', 'Joining Date', 'Expiry', 'Template', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(letter => {
                const meta = STATUS_META[letter.status];
                const Icon = meta.icon;
                const next = STATUS_TRANSITIONS[letter.status];
                return (
                  <tr key={letter.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{letter.candidateName}</p>
                      <p className="text-xs text-gray-400">{letter.candidateEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{letter.jobTitle}</p>
                      <p className="text-xs text-gray-400">{letter.department}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(letter.offeredSalary)}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(letter.joiningDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(letter.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                        {POLICY_TEMPLATES.find(t => t.value === letter.policyTemplate)?.label || letter.policyTemplate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${meta.color}`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {next.length > 0 && (
                        <div className="flex gap-1">
                          {next.map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(letter.id, s)}
                              className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-100 text-gray-600"
                            >
                              {s === 'SENT' ? 'Send' : s === 'ACCEPTED' ? 'Accept' : s === 'REJECTED' ? 'Reject' : 'Expire'}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No offer letters found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Generate Offer Letter</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'candidateId', label: 'Candidate ID', placeholder: 'e.g. cand_001' },
                { key: 'candidateName', label: 'Candidate Name', placeholder: 'Full name' },
                { key: 'candidateEmail', label: 'Email', placeholder: 'email@example.com', type: 'email' },
                { key: 'jobTitle', label: 'Job Title', placeholder: 'e.g. Senior Developer' },
                { key: 'department', label: 'Department', placeholder: 'e.g. Engineering' },
                { key: 'offeredSalary', label: 'Offered Salary (INR)', placeholder: '1800000', type: 'number' },
                { key: 'joiningDate', label: 'Joining Date', type: 'date' },
                { key: 'expiryDate', label: 'Offer Expiry', type: 'date' },
              ].map(f => (
                <div key={f.key} className={f.key === 'candidateName' || f.key === 'candidateEmail' ? 'col-span-1' : ''}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Policy Template</label>
                <select
                  value={form.policyTemplate}
                  onChange={e => setForm(p => ({ ...p, policyTemplate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {POLICY_TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
