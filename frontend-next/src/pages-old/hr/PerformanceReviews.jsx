'use client';

import { useState, useEffect } from 'react';
import { 
  Award, 
  Clock, 
  Search, 
  Plus, 
  Star, 
  CheckCircle2, 
  X, 
  Sliders, 
  UserCheck,
  Loader2,
  TrendingUp
} from 'lucide-react';
import {
  getPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  getCounselorMetrics,
} from '../../services/hrApi';

export default function PerformanceReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const [selectedReviewForAppraisal, setSelectedReviewForAppraisal] = useState(null);
  const [counselorMetrics, setCounselorMetrics] = useState(null);
  const [kpiScores, setKpiScores] = useState({
    kpi1: 4,
    kpi2: 4,
    kpi3: 4,
    feedback: ''
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getPerformanceReviews();
      if (res.success) setReviews(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAppraisalDrawer = async (rev) => {
    setSelectedReviewForAppraisal(rev);
    setKpiScores({
      kpi1: rev.kpiScores?.kpi1 ?? (rev.rating > 0 ? Math.floor(rev.rating) : 4),
      kpi2: rev.kpiScores?.kpi2 ?? (rev.rating > 0 ? Math.ceil(rev.rating) : 4),
      kpi3: rev.kpiScores?.kpi3 ?? (rev.rating > 0 ? Math.round(rev.rating) : 4),
      feedback: rev.kpiScores?.feedback || (rev.status === 'Completed' ? 'Highly professional and goal oriented.' : '')
    });
    setCounselorMetrics(null);
    const dept = (rev.department || '').toLowerCase();
    if (dept.includes('counsel')) {
      try {
        const res = await getCounselorMetrics(rev.employeeId);
        if (res.success) setCounselorMetrics(res.data);
      } catch (err) {
        console.error('Counselor metrics unavailable:', err);
      }
    }
  };

  const handleAppraisalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReviewForAppraisal) return;
    const avg = parseFloat(((kpiScores.kpi1 + kpiScores.kpi2 + kpiScores.kpi3) / 3).toFixed(1));
    try {
      const res = await updatePerformanceReview(selectedReviewForAppraisal.id, {
        rating: avg,
        status: 'Completed',
        kpiScores,
      });
      if (res.success) {
        setSelectedReviewForAppraisal(null);
        await fetchReviews();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit appraisal');
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.employeeId) return;
    try {
      const res = await createPerformanceReview(newReview);
      if (res.success) {
        setShowAddModal(false);
        setNewReview({
          name: '', employeeId: '', department: 'Engineering',
          cycle: 'FY26 H1 Review', manager: 'Jane Admin', status: 'Self-Review'
        });
        await fetchReviews();
      }
    } catch (err) {
      alert(err.message || 'Failed to create review');
    }
  };

  const filteredReviews = reviews.filter(rev => 
    (rev.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rev.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rev.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedReviews = reviews.filter(r => r.status === 'Completed').length;
  const ratedReviews = reviews.filter(r => r.rating > 0);
  const avgRating = (ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
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
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" size={28} /></div>
            ) : (
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
                    {filteredReviews.length > 0 ? (
                      filteredReviews.map((rev) => (
                        <tr key={rev.id} className="hover:bg-slate-50/50 transition-all duration-200 cursor-pointer" onClick={() => handleOpenAppraisalDrawer(rev)}>
                          <td className="px-6 py-5 text-xs font-mono font-bold text-indigo-600 tracking-wider">{rev.employeeId}</td>
                          <td className="px-6 py-5">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{rev.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{rev.department}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs font-semibold text-slate-600">{rev.cycle}</td>
                          <td className="px-6 py-5 text-xs font-medium text-slate-650">{rev.manager}</td>
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
                              rev.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : rev.status === 'Manager Review' ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : rev.status === 'Calibrated' ? 'bg-indigo-50 border-indigo-200 text-indigo-650'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>{rev.status}</span>
                          </td>
                          <td className="px-6 py-5 text-right text-xs font-mono text-slate-500">{rev.date}</td>
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
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Initiate appraisal record</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateReview} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Staff member name</label>
                <input type="text" required placeholder="e.g. Raju Kalla" value={newReview.name}
                  onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-indigo-600 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">University ID</label>
                <input type="text" required placeholder="e.g. E001" value={newReview.employeeId}
                  onChange={e => setNewReview({ ...newReview, employeeId: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Department</label>
                  <select value={newReview.department} onChange={e => setNewReview({ ...newReview, department: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none">
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Counselling">Counselling</option>
                    <option value="Processing">Processing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Assigned evaluator</label>
                  <input type="text" required value={newReview.manager}
                    onChange={e => setNewReview({ ...newReview, manager: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-600" />
                </div>
              </div>
              <div className="flex gap-3 border-t border-slate-200 pt-6 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-xs font-semibold hover:bg-slate-50 text-slate-600">Discard</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-xs hover:bg-indigo-700">Confirm Appraisal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReviewForAppraisal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex-1" onClick={() => setSelectedReviewForAppraisal(null)} />
          <div className="bg-white border-l border-slate-200 w-full max-w-lg h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Conduct Appraisal</h2>
                <p className="text-xs text-slate-500 mt-0.5">Evaluate and calibrate performance scores</p>
              </div>
              <button onClick={() => setSelectedReviewForAppraisal(null)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><X size={20} /></button>
            </div>

            <div className="p-6 border-b border-slate-100 bg-indigo-50/30">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-700"><UserCheck size={24} /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedReviewForAppraisal.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedReviewForAppraisal.department} • ID: {selectedReviewForAppraisal.employeeId}</p>
                </div>
              </div>
            </div>

            {counselorMetrics && (
              <div className="p-6 border-b border-slate-100 bg-emerald-50/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={14} /> Live Counselor Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-slate-500">Leads Assigned</p>
                    <p className="text-lg font-bold text-slate-800">{counselorMetrics.leadsAssigned ?? 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-slate-500">Conversion Rate</p>
                    <p className="text-lg font-bold text-slate-800">{counselorMetrics.conversionRate ?? 0}%</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-slate-500">Enrolments</p>
                    <p className="text-lg font-bold text-slate-800">{counselorMetrics.enrolments ?? 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-slate-500">Avg Response (hrs)</p>
                    <p className="text-lg font-bold text-slate-800">{counselorMetrics.avgResponseHours ?? '—'}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleAppraisalSubmit} className="flex-1 flex flex-col p-6 space-y-6">
              <div className="space-y-4 flex-1">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {getKpiDetails(selectedReviewForAppraisal.department).title}
                  </h4>
                </div>
                {['kpi1', 'kpi2', 'kpi3'].map((key, idx) => {
                  const labels = getKpiDetails(selectedReviewForAppraisal.department);
                  const labelKey = `${key}Label`;
                  const descKey = `${key}Desc`;
                  return (
                    <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <label className="text-xs font-bold text-slate-800">{labels[labelKey]}</label>
                          <p className="text-[11px] text-slate-500 mt-0.5">{labels[descKey]}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg">{kpiScores[key]} / 5</span>
                      </div>
                      <input type="range" min="1" max="5" step="1" value={kpiScores[key]}
                        onChange={e => setKpiScores({ ...kpiScores, [key]: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                  );
                })}
                <div className="p-4 bg-indigo-600/10 border border-indigo-200/50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="text-indigo-600 w-5 h-5" />
                    <p className="text-xs font-bold text-indigo-950">Calculated Average Rating</p>
                  </div>
                  <span className="text-xl font-black text-indigo-700">
                    {((kpiScores.kpi1 + kpiScores.kpi2 + kpiScores.kpi3) / 3).toFixed(1)} / 5.0
                  </span>
                </div>
                <textarea required rows={3} placeholder="Provide constructive assessment..."
                  value={kpiScores.feedback} onChange={e => setKpiScores({ ...kpiScores, feedback: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none resize-none focus:border-indigo-600" />
              </div>
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setSelectedReviewForAppraisal(null)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-xs font-semibold hover:bg-slate-50 text-slate-600">Discard</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-xs hover:bg-indigo-700">Submit Calibration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const getKpiDetails = (department) => {
  const dept = (department || '').toLowerCase();
  if (dept.includes('counsel') || dept.includes('counsellor')) {
    return {
      title: 'Counsellor Performance Metrics',
      kpi1Label: 'Lead Conversion Rate',
      kpi1Desc: 'Rate of converting prospective leads into active student enrolments.',
      kpi2Label: 'Average Response Time',
      kpi2Desc: 'Average time taken to respond to student queries and follow-ups.',
      kpi3Label: 'Student Satisfaction (CSAT)',
      kpi3Desc: 'Feedback score received from students on counselling services.'
    };
  } else if (dept.includes('marketing')) {
    return {
      title: 'Marketing Performance Metrics',
      kpi1Label: 'Leads Generated',
      kpi1Desc: 'Quantity and quality of marketing-generated student leads.',
      kpi2Label: 'Campaign ROI',
      kpi2Desc: 'Cost effectiveness and return on marketing campaign spend.',
      kpi3Label: 'Brand Reach & Engagement',
      kpi3Desc: 'Growth in brand impressions, web traffic, and social media engagement.'
    };
  } else if (dept.includes('processing')) {
    return {
      title: 'Processing Officer Performance Metrics',
      kpi1Label: 'Visa Success Rate',
      kpi1Desc: 'Percentage of visa applications successfully approved.',
      kpi2Label: 'Document Accuracy',
      kpi2Desc: 'Meticulousness and compliance in preparing student application packets.',
      kpi3Label: 'File Processing Turnaround Time',
      kpi3Desc: 'Efficiency in completing processing checklists and file submission.'
    };
  }
  return {
    title: 'Standard Performance Metrics',
    kpi1Label: 'Quality of Work',
    kpi1Desc: 'Accuracy, thoroughness, and overall standard of completed tasks.',
    kpi2Label: 'Professionalism & Teamwork',
    kpi2Desc: 'Collaboration with peers and adherence to organizational ethics.',
    kpi3Label: 'Timeliness & Reliability',
    kpi3Desc: 'Consistency in meeting project deadlines and handling responsibilities.'
  };
};
