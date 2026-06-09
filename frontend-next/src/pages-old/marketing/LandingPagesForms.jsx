'use client';

import { useEffect, useState } from 'react';
import { 
  getLandingPages, 
  createLandingPage, 
  updateLandingPage, 
  deleteLandingPage,
  getFormsSummary
} from '../../services/marketingApi';
import { 
  Search, 
  Plus, 
  Loader2, 
  AlertCircle, 
  X, 
  Trash2, 
  Edit,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const LandingPagesForms = () => {
  const [pages, setPages] = useState([]);
  const [summary, setSummary] = useState({
    totalFormsPublished: 0,
    totalLeadsCaptured: 0,
    averageConversionRate: 0,
    visits30Days: 0,
    leads30Days: 0,
    averageEngagementRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    type: 'GUIDE',
    country: '',
    course: '',
    visits: 0,
    leads: 0,
    seoTitle: '',
    seoDescription: '',
    content: '',
    formId: 'main-intake-form'
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLandingPages({ search: searchQuery });
      if (res.success) {
        setPages(res.data.items || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else {
        setError(res.message || 'Failed to retrieve landing pages');
      }

      // Also explicitly fetch summary
      const summaryRes = await getFormsSummary();
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend database server lost. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedPageId(null);
    setPageForm({
      title: '',
      slug: '',
      type: 'GUIDE',
      country: '',
      course: '',
      visits: 0,
      leads: 0,
      seoTitle: '',
      seoDescription: '',
      content: '',
      formId: 'main-intake-form'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (page) => {
    setIsEditing(true);
    setSelectedPageId(page.id);
    setPageForm({
      title: page.title || '',
      slug: page.slug || '',
      type: page.type || 'GUIDE',
      country: page.country || '',
      course: page.course || '',
      visits: page.visits || 0,
      leads: page.leads || 0,
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
      content: page.content || '',
      formId: page.formId || 'main-intake-form'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this landing page?')) return;
    try {
      const res = await deleteLandingPage(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Failed to delete landing page');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while deleting page');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formattedSlug = pageForm.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      const payload = {
        ...pageForm,
        slug: formattedSlug,
        visits: Number(pageForm.visits),
        leads: Number(pageForm.leads)
      };
      
      let res;
      if (isEditing) {
        res = await updateLandingPage(selectedPageId, payload);
      } else {
        res = await createLandingPage(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Failed to save landing page');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving landing page. Please verify your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'GUIDE':
        return 'inline-flex items-center px-3 py-0.5 rounded-[6px] text-xs font-semibold bg-[#e6f4ea] text-[#137333] border border-[#bbf7d0]';
      case 'EVENT':
        return 'inline-flex items-center px-3 py-0.5 rounded-[6px] text-xs font-semibold bg-[#f0fdfa] text-[#0d9488] border border-[#99f6e4]';
      case 'FORM':
        return 'inline-flex items-center px-3 py-0.5 rounded-[6px] text-xs font-semibold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]';
      case 'APPLICATION':
        return 'inline-flex items-center px-3 py-0.5 rounded-[6px] text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]';
      default:
        return 'inline-flex items-center px-3 py-0.5 rounded-[6px] text-xs font-semibold bg-slate-100 text-neutral-700 border border-neutral-200';
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'GUIDE': 'Guide',
      'EVENT': 'Event',
      'FORM': 'Form',
      'APPLICATION': 'Application'
    };
    return map[type] || type;
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen px-8 py-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-neutral-200 text-sm bg-white focus:outline-none focus:border-slate-400 text-neutral-700 placeholder-slate-400 transition"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          Add page
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Main Content Layout Grid */}
      {loading && pages.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-neutral-900 animate-spin mb-3" />
          <span className="text-sm text-neutral-500 font-medium">Fetching analytics performance...</span>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          {/* Left Column: Landing Pages Performance Card (3/5) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-neutral-100">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Landing pages performance
                </h2>
                <button
                  onClick={loadData}
                  className="px-4 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-semibold transition"
                >
                  View All
                </button>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                {pages.length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 font-semibold text-sm bg-white">
                    No landing pages found
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-neutral-100 text-xs font-semibold text-neutral-500">
                        <th className="px-6 py-4 font-semibold text-neutral-500">Landing Page Name</th>
                        <th className="px-6 py-4 font-semibold text-neutral-500">Type</th>
                        <th className="px-6 py-4 font-semibold text-neutral-500 text-right">Visits</th>
                        <th className="px-6 py-4 font-semibold text-neutral-500 text-right">Leads</th>
                        <th className="px-6 py-4 font-semibold text-neutral-500 text-right">Conversion</th>
                        <th className="px-6 py-4 font-semibold text-neutral-500 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-sm font-medium text-neutral-700">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-neutral-50/55 transition duration-150">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-neutral-900 leading-tight">
                              {page.title}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              /{page.slug}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getTypeBadge(page.type)}>
                              {getTypeLabel(page.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                            {page.visits?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                            {page.leads?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                            {page.conversionRate ? `${page.conversionRate.toFixed(1)}%` : '0.0%'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(page)}
                                className="p-1 rounded hover:bg-slate-100 text-neutral-500 hover:text-neutral-700 transition"
                                title="Edit page"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(page.id)}
                                className="p-1 rounded hover:bg-slate-100 text-rose-500 hover:text-rose-700 transition"
                                title="Delete page"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Forms Performance Summary (2/5) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-neutral-100">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Forms Performance Summary
                </h2>
              </div>

              {/* Summary Items List */}
              <div className="divide-y divide-neutral-100 text-sm font-medium text-neutral-600">
                <div className="px-6 py-4.5 flex justify-between items-center hover:bg-neutral-50/30 transition">
                  <span>Total Forms Published</span>
                  <span className="text-neutral-900 font-semibold text-base">
                    {summary.totalFormsPublished || 0}
                  </span>
                </div>
                <div className="px-6 py-4.5 flex justify-between items-center hover:bg-neutral-50/30 transition">
                  <span>Total Leads Captured</span>
                  <span className="text-neutral-900 font-semibold text-base">
                    {summary.totalLeadsCaptured?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="px-6 py-4.5 flex justify-between items-center hover:bg-neutral-50/30 transition">
                  <span>Avg. Conversion Rate</span>
                  <span className="text-neutral-900 font-semibold text-base">
                    {summary.averageConversionRate ? `${summary.averageConversionRate.toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
                <div className="px-6 py-4.5 flex justify-between items-center hover:bg-neutral-50/30 transition">
                  <span>Visits (30 days)</span>
                  <span className="text-neutral-900 font-semibold text-base">
                    {summary.visits30Days?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="px-6 py-4.5 flex justify-between items-center hover:bg-neutral-50/30 transition">
                  <span>Leads (30 days)</span>
                  <span className="text-neutral-900 font-semibold text-base">
                    {summary.leads30Days?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="px-6 py-4.5 flex justify-between items-center hover:bg-neutral-50/30 transition">
                  <span>Average Engagement Rate</span>
                  <span className="text-neutral-900 font-semibold text-base">
                    {summary.averageEngagementRate ? `${summary.averageEngagementRate.toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-auto max-h-[90vh] overflow-y-auto border border-neutral-200 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-lg font-semibold text-neutral-900">
                {isEditing ? 'Edit Landing Page' : 'Add New Landing Page'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-neutral-500 hover:text-neutral-700 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-500">Landing Page Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study Abroad Guide"
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-500">Slug Handle Route * (Letters/Numbers/Hyphens)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. study-abroad-guide"
                  value={pageForm.slug}
                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-500">Type *</label>
                  <select
                    value={pageForm.type}
                    onChange={(e) => setPageForm({ ...pageForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-600"
                  >
                    <option value="GUIDE">Guide</option>
                    <option value="EVENT">Event</option>
                    <option value="FORM">Form</option>
                    <option value="APPLICATION">Application</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-500">Form ID Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. lead-capture-form"
                    value={pageForm.formId}
                    onChange={(e) => setPageForm({ ...pageForm, formId: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-500">Target Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Canada"
                    value={pageForm.country}
                    onChange={(e) => setPageForm({ ...pageForm, country: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700 placeholder-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-500">Target Course</label>
                  <input
                    type="text"
                    placeholder="e.g. Business Administration"
                    value={pageForm.course}
                    onChange={(e) => setPageForm({ ...pageForm, course: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-500">Visits</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={pageForm.visits}
                    onChange={(e) => setPageForm({ ...pageForm, visits: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-500">Leads</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={pageForm.leads}
                    onChange={(e) => setPageForm({ ...pageForm, leads: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-500">Page Content / Intro Copy</label>
                <textarea
                  rows={2}
                  placeholder="Introductory text displayed to the visitor."
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-neutral-700 font-semibold text-neutral-700 placeholder-slate-400"
                />
              </div>

              <div className="border-t border-neutral-100 pt-3 space-y-3">
                <h4 className="text-xs font-semibold text-neutral-500">SEO Meta Setup</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-neutral-500">SEO Title Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Study Abroad Roadmap & Free Counseling Session"
                      value={pageForm.seoTitle}
                      onChange={(e) => setPageForm({ ...pageForm, seoTitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-neutral-700 text-neutral-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-neutral-500 font-semibold">SEO Meta Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Download the official guide and connect with admissions counsel experts."
                      value={pageForm.seoDescription}
                      onChange={(e) => setPageForm({ ...pageForm, seoDescription: e.target.value })}
                      className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-neutral-700 text-neutral-700"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold transition flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEditing ? 'Save changes' : 'Add page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPagesForms;
