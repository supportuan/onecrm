'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Award, 
  TrendingUp, 
  Users, 
  Clock, 
  Search, 
  Plus, 
  Star, 
  CheckCircle2, 
  X, 
  Sliders, 
  UserCheck,
  Loader2
} from 'lucide-react';
import { getPerformanceReviews, createPerformanceReview } from '../../services/hrApi';

export default function PerformanceReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    employeeId: '',
    department: 'Engineering',
    cycle: 'FY26 H1 Review',
    manager: 'Jane Admin',
    status: 'Self-Review'
  });

  const fetchReviews = useCallback(async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPerformanceReviews(search || undefined);
      if (res.success) {
        setReviews(res.data || []);
      } else {
        setError(res.message || 'Failed to load performance reviews');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to HR database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchReviews(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchReviews]);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.employeeId) return;

    setSubmitting(true);
    try {
      const res = await createPerformanceReview({
        ...newReview,
        date: new Date().toISOString().split('T')[0],
      });
      if (res.success) {
        setShowAddModal(false);
        setNewReview({
          name: '',
          employeeId: '',
          department: 'Engineering',
          cycle: 'FY26 H1 Review',
          manager: 'Jane Admin',
          status: 'Self-Review'
        });
        await fetchReviews(searchQuery);
      } else {
        alert(res.message || 'Failed to create review');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create performance review');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews;

  const completedReviews = reviews.filter(r => r.status === 'Completed').length;
  const avgRating = (reviews.filter(r => r.rating > 0).reduce((sum, r) => sum + r.rating, 0) / reviews.filter(r => r.rating > 0).length || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      {/* Title */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-900">
            Performance Reviews & Goals
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Conduct appraisals, track feedback cycles, calibrate results, and manage employee performance goals.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:scale-[1.01] hover:shadow-lg hover:bg-indigo-700 transition-all shrink-0"
        >
          <Plus size={14} />
          Initiate Review
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Appraisal Cycles Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active cycles</span>
              <Sliders size={20} className="text-indigo-600 opacity-60" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">FY26 H1</p>
            <div className="text-[11px] font-medium text-slate-400 mt-1">Active institutional appraisal</div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Reviews in progress</span>
              <Clock size={20} className="text-amber-500 opacity-60" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{reviews.length - completedReviews}</p>
            <div className="text-[11px] font-medium text-slate-400 mt-1">Pending calibration / submissions</div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Completed reviews</span>
              <CheckCircle2 size={20} className="text-emerald-500 opacity-60" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{completedReviews}</p>
            <div className="text-[11px] font-medium text-slate-400 mt-1">Signed off & locked ledgers</div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Average rating score</span>
              <Star size={20} className="text-yellow-500 opacity-60" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{avgRating} / 5.0</p>
            <div className="text-[11px] font-medium text-slate-400 mt-1">Average peer & manager score</div>
          </div>
        </div>

        {/* Filter and appraisal ledger */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search appraisals by name, ID, or department..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600">
              {filteredReviews.length} Enrolled assessments
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="px-6 py-4">University ID</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Appraisal cycle</th>
                    <th className="px-6 py-4">Assigned evaluator</th>
                    <th className="px-6 py-4">Final score</th>
                    <th className="px-6 py-4">Assessment status</th>
                    <th className="px-6 py-4 text-right">Appraisal date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                        <span className="block mt-3">Loading performance reviews...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-sm text-red-500">{error}</td>
                    </tr>
                  ) : filteredReviews.length > 0 ? (
                    filteredReviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50/50 transition-all duration-200">
                        <td className="px-6 py-5 text-xs font-mono font-bold text-indigo-600 tracking-wider">
                          {rev.employeeId}
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{rev.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{rev.department}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-semibold text-slate-600">
                          {rev.cycle}
                        </td>
                        <td className="px-6 py-5 text-xs font-medium text-slate-650">
                          {rev.manager}
                        </td>
                        <td className="px-6 py-5">
                          {rev.rating > 0 ? (
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                              <Star size={12} className="fill-amber-600 text-amber-600" />
                              {rev.rating.toFixed(1)} / 5.0
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not appraised</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${
                            rev.status === 'Completed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : rev.status === 'Manager Review'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : rev.status === 'Calibrated'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-650'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {rev.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right text-xs font-mono text-slate-500">
                          {rev.date}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-500 italic">
                        No performance assessments found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add appraisal modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Initiate appraisal record</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateReview} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Staff member name</label>
                <input
                  type="text" 
                  required
                  placeholder="e.g. Raju Kalla"
                  value={newReview.name}
                  onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">University ID</label>
                <input
                  type="text" 
                  required
                  placeholder="e.g. E001"
                  value={newReview.employeeId}
                  onChange={e => setNewReview({ ...newReview, employeeId: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-850 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Department</label>
                  <select
                    value={newReview.department}
                    onChange={e => setNewReview({ ...newReview, department: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Assigned evaluator</label>
                  <input
                    type="text" 
                    required
                    value={newReview.manager}
                    onChange={e => setNewReview({ ...newReview, manager: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-850 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-xs font-semibold hover:bg-slate-50 text-slate-600 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-xs hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  Confirm Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
