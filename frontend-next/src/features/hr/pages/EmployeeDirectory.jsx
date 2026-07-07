'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Shield,
  MapPin,
  Mail,
  Phone,
  Fingerprint,
  Building2,
  Briefcase,
  X,
  ClipboardCheck,
} from 'lucide-react';
import { getEmployees, assignAccessRole, bulkImportEmployees, createEmployee } from '@/services/hrApi';
import EmployeeDetailModal, { statusBadgeClass } from './EmployeeDetailModal';
import { HR_ACCESS_ROLES } from '../constants/accessRoles';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [newRole, setNewRole] = useState('EMPLOYEE');

  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const [importFeedback, setImportFeedback] = useState(null);

  // Single-employee create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: 'Engineering',
    designation: 'Staff Member',
    location: 'HQ Office',
    phone: '',
    joiningDate: '',
    access_role: 'EMPLOYEE',
  });
  const [createFeedback, setCreateFeedback] = useState(null);

  useEffect(() => {
    fetchDirectory();
  }, [statusFilter]);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await getEmployees(statusFilter === 'ALL' ? undefined : statusFilter);
      if (res.success) setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to fetch Employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSubmitting(true);
    try {
      const res = await assignAccessRole(selectedEmp.id, newRole);
      if (res.success) {
        setEmployees(employees.map((emp) => (emp.id === selectedEmp.id ? { ...emp, access_role: newRole } : emp)));
        setShowRoleModal(false);
        setSelectedEmp(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleParsePaste = () => {
    if (!pasteData.trim()) return;

    const lines = pasteData.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert('pasted content must include a header row and at least one data row.');
      return;
    }

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

    const idxEmail = headers.findIndex((h) => h.includes('email'));
    const idxName = headers.findIndex((h) => h.includes('name') || h.includes('first'));
    const idxLastName = headers.findIndex((h) => h.includes('last'));
    const idxEmpId = headers.findIndex((h) => h.includes('id') || h.includes('code'));
    const idxRole = headers.findIndex((h) => h.includes('role'));
    const idxDept = headers.findIndex((h) => h.includes('dept') || h.includes('department'));
    const idxDesig = headers.findIndex((h) => h.includes('title') || h.includes('designation'));
    const idxLocation = headers.findIndex((h) => h.includes('location') || h.includes('office'));
    const idxPhone = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));

    const rows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.trim());

      const email = idxEmail !== -1 ? cols[idxEmail] : '';
      const firstName = idxName !== -1 ? cols[idxName] : '';
      const lastName = idxLastName !== -1 ? cols[idxLastName] : '';
      const employeeId = idxEmpId !== -1 ? cols[idxEmpId] : '';
      const access_role = idxRole !== -1 ? cols[idxRole].toUpperCase() : 'EMPLOYEE';
      const department = idxDept !== -1 ? cols[idxDept] : 'Operations';
      const designation = idxDesig !== -1 ? cols[idxDesig] : 'Staff Member';
      const location = idxLocation !== -1 ? cols[idxLocation] : 'HQ Office';
      const phone = idxPhone !== -1 ? cols[idxPhone] : '';

      let name = firstName;
      if (lastName) name += ' ' + lastName;
      if (!name) name = email ? email.split('@')[0] : 'Unnamed Staff';

      const errors = [];
      if (!email) errors.push('missing email');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('invalid email format');
      if (!employeeId) errors.push('missing id');

      const isRowValid = errors.length === 0;
      if (isRowValid) validCount++;
      else invalidCount++;

      rows.push({
        rowNum: i + 1,
        data: { name, email, employeeId, access_role, department, designation, location, phone },
        errors,
        isValid: isRowValid,
      });
    }

    setParsedRows(rows);
    setImportSummary({ total: rows.length, valid: validCount, invalid: invalidCount });
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.employeeId) return;
    setSubmitting(true);
    setCreateFeedback(null);
    try {
      const res = await createEmployee(createForm);
      if (res.success) {
        setCreateFeedback({ type: 'success', text: 'Employee added successfully' });
        setCreateForm({
          name: '',
          email: '',
          employeeId: '',
          department: 'Engineering',
          designation: 'Staff Member',
          location: 'HQ Office',
          phone: '',
          joiningDate: '',
          access_role: 'EMPLOYEE',
        });
        await fetchDirectory();
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateFeedback(null);
        }, 1200);
      } else {
        setCreateFeedback({ type: 'error', text: res.message || 'Failed to add employee' });
      }
    } catch (err) {
      setCreateFeedback({ type: 'error', text: err.message || 'Failed to add employee' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommitImport = async () => {
    const validPayloads = parsedRows.filter((r) => r.isValid).map((r) => r.data);
    if (validPayloads.length === 0) return;

    setSubmitting(true);
    setImportFeedback(null);
    try {
      const res = await bulkImportEmployees(validPayloads);
      if (res.success) {
        setImportFeedback({ type: 'success', text: `imported ${res.count || validPayloads.length} new records successfully.` });
        setPasteData('');
        setParsedRows([]);
        setImportSummary(null);
        await fetchDirectory();
      } else {
        setImportFeedback({ type: 'error', text: res.error || 'failed to complete bulk import.' });
      }
    } catch (err) {
      console.error(err);
      setImportFeedback({ type: 'error', text: 'connection error during directory import.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ui-page text-neutral-800 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Employee directory</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Maintain employee profiles, update access roles, and bulk-import personnel from a spreadsheet.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!showBulkPanel && (
            <button
              onClick={() => {
                setCreateFeedback(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-semibold bg-neutral-900 text-white shadow-md  hover:bg-neutral-800 transition-all"
            >
              <Plus size={14} /> add employee
            </button>
          )}
          <button
            onClick={() => {
              setShowBulkPanel(!showBulkPanel);
              setImportFeedback(null);
              setParsedRows([]);
              setImportSummary(null);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-semibold transition-all bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900"
          >
            {showBulkPanel ? <Users size={14} /> : <Upload size={14} />}
            {showBulkPanel ? 'view directory' : 'bulk import'}
          </button>
        </div>
      </div>

      <div>
        {!showBulkPanel ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search + count */}
            <div className="ui-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="filter by name, email, department, or id..."
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 shrink-0"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              <div className="px-5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[10px] font-semibold text-neutral-600 shrink-0">
                {employees.length} personnel
              </div>
            </div>

            {/* Directory table */}
            <div className="ui-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-semibold text-neutral-500">
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Personnel</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Organization</th>
                      <th className="px-6 py-4">Biometric ID</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Access role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin text-neutral-700 mx-auto" size={24} />
                          <p className="text-[10px] font-semibold text-neutral-500 mt-2">loading directory...</p>
                        </td>
                      </tr>
                    ) : filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-neutral-50/50 transition-all duration-200">
                          <td className="px-6 py-5 text-xs font-mono font-semibold text-neutral-700">
                            {emp.employeeId || `EMP-${(emp.id || '').toString().substring(0, 4)}`}
                          </td>
                          <td className="px-6 py-5">
                            <div>
                              <p className="text-xs font-semibold text-neutral-800">{emp.name}</p>
                              <p className="text-[9px] text-neutral-500 font-semibold mt-1 flex items-center gap-1">
                                <MapPin size={10} className="text-neutral-500" /> {emp.location || 'HQ office'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1 text-xs">
                              <p className="text-neutral-600 flex items-center gap-1.5 font-medium">
                                <Mail size={11} className="text-neutral-500" /> {emp.email}
                              </p>
                              {emp.phone && (
                                <p className="text-neutral-500 flex items-center gap-1.5 font-mono">
                                  <Phone size={11} className="text-neutral-500" /> {emp.phone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1 text-xs">
                              <p className="text-neutral-800 flex items-center gap-1.5 font-semibold">
                                <Briefcase size={11} className="text-neutral-500" /> {emp.designation || 'staff member'}
                              </p>
                              <p className="text-[10px] text-neutral-500 flex items-center gap-1.5 font-semibold">
                                <Building2 size={11} className="text-neutral-500" /> {emp.department || 'operations'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs font-mono font-semibold text-neutral-500">
                            <span className="flex items-center gap-1 text-[10px]">
                              <Fingerprint size={12} className="text-neutral-500" />
                              {emp.biometricId || emp.employeeId || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border inline-flex items-center w-fit ${statusBadgeClass(
                                emp.employmentStatus || 'ACTIVE',
                              )}`}
                            >
                              {(emp.employmentStatus || 'ACTIVE').replace('_', ' ').toLowerCase()}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border inline-flex items-center gap-1 w-fit ${
                                emp.access_role?.includes('ADMIN')
                                  ? 'bg-neutral-100 text-neutral-900 border-neutral-200'
                                  : emp.access_role === 'COUNSELLOR'
                                  ? 'bg-neutral-50 text-neutral-800 border-neutral-300'
                                  : emp.access_role?.includes('HR')
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-slate-100 text-neutral-600 border-neutral-200'
                              }`}
                            >
                              <Shield size={11} className="opacity-80" />
                              {(emp.access_role || 'EMPLOYEE').replace('_', ' ').toLowerCase()}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setDetailEmployee(emp);
                                  setShowDetailModal(true);
                                }}
                                className="px-3.5 py-1.5 bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-700 rounded-xl text-[10px] font-semibold transition-all"
                              >
                                view
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEmp(emp);
                                  setNewRole(emp.access_role || 'EMPLOYEE');
                                  setShowRoleModal(true);
                                }}
                                className="px-3.5 py-1.5 bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-700 rounded-xl text-[10px] font-semibold transition-all"
                              >
                                edit role
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-xs text-neutral-500">
                          no personnel registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Bulk parsing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Paste area */}
              <div className="ui-card space-y-6 lg:col-span-1 h-fit">
                <div className="border-b border-neutral-200 pb-4">
                  <h3 className="text-xs font-semibold text-neutral-800">Spreadsheet paste</h3>
                  <p className="text-[10px] text-neutral-500 mt-1">copy and paste rows directly from excel or google sheets.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-neutral-500 ml-1">Tabular raw data</label>
                    <textarea
                      rows={10}
                      className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-mono text-neutral-700 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                      placeholder={`employeeId\tfirstName\tlastName\temail\tdepartment\tdesignation\tlocation\tphone\nE005\tJohn\tDoe\tjohn.doe@onecrm.com\tEngineering\tSoftware Engineer\tHQ Office\t9876543210`}
                      value={pasteData}
                      onChange={(e) => setPasteData(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleParsePaste}
                    className="w-full py-3.5 bg-neutral-900 text-white rounded-lg font-semibold text-[10px] shadow-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ClipboardCheck size={14} />
                    validate rows
                  </button>
                </div>

                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-lg space-y-2 text-[10px] text-neutral-600 leading-normal">
                  <p className="font-semibold text-neutral-700">expected header keys:</p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-500">
                    <li>employeeId <span className="text-neutral-500">(required)</span></li>
                    <li>firstName, lastName <span className="text-neutral-500">(or name)</span></li>
                    <li>Email <span className="text-neutral-500">(required)</span></li>
                    <li>Department, designation</li>
                    <li>Location, phone, role</li>
                  </ul>
                </div>
              </div>

              {/* Preview */}
              <div className="lg:col-span-2 space-y-6">
                {importSummary && (
                  <div className="ui-panel p-6 flex items-center justify-between gap-6">
                    <div className="flex gap-8 text-xs font-semibold text-neutral-500">
                      <div>parsed: <span className="text-neutral-800 font-semibold">{importSummary.total}</span></div>
                      <div>valid: <span className="text-emerald-600 font-semibold">{importSummary.valid}</span></div>
                      <div>flagged: <span className="text-rose-500 font-semibold">{importSummary.invalid}</span></div>
                    </div>

                    <button
                      onClick={handleCommitImport}
                      disabled={submitting || importSummary.valid === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold text-[10px] shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      import verified accounts
                    </button>
                  </div>
                )}

                {importFeedback && (
                  <div
                    className={`p-4 rounded-lg flex items-center gap-3 border ${
                      importFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {importFeedback.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0" />
                    )}
                    <span className="text-xs font-semibold">{importFeedback.text}</span>
                  </div>
                )}

                <div className="ui-panel overflow-hidden">
                  <div className="px-8 py-5 border-b border-neutral-200 bg-neutral-50">
                    <h3 className="text-xs font-semibold text-neutral-600">Ingestion preview</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-semibold text-neutral-500">
                          <th className="px-6 py-4">Row</th>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Personnel</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Department / designation</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {parsedRows.length > 0 ? (
                          parsedRows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                row.isValid ? 'hover:bg-neutral-50/50' : 'bg-rose-50 hover:bg-rose-100/50'
                              }`}
                            >
                              <td className="px-6 py-4 text-xs font-mono font-semibold text-neutral-500">{row.rowNum}</td>
                              <td className="px-6 py-4 text-xs font-mono font-semibold text-neutral-700">
                                {row.data.employeeId || '—'}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-neutral-800">{row.data.name}</td>
                              <td className="px-6 py-4 text-xs text-neutral-600 font-medium">{row.data.email || '—'}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-neutral-500">
                                {row.data.designation} ·{' '}
                                <span className="text-[10px] font-semibold text-neutral-500">{row.data.department}</span>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-neutral-600">{row.data.access_role}</td>
                              <td className="px-6 py-4">
                                {row.isValid ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-semibold rounded-lg">
                                    verified
                                  </span>
                                ) : (
                                  <div className="space-y-0.5">
                                    {row.errors.map((err, eidx) => (
                                      <span
                                        key={eidx}
                                        className="block text-[8px] font-semibold text-rose-500 tracking-tight flex items-center gap-0.5"
                                      >
                                        <AlertCircle size={8} /> {err}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-16 text-center text-xs text-neutral-500">
                              <FileSpreadsheet size={32} className="text-neutral-600 mx-auto mb-3" />
                              Ingestion preview is empty. paste rows in the panel on the left.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-modal scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="text-xs font-semibold text-neutral-800">Add new employee</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">full name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. john doe"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">email *</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. john.doe@onecrm.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Employee ID *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. E005"
                    value={createForm.employeeId}
                    onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 99999 88888"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. engineering"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. software engineer"
                    value={createForm.designation}
                    onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. hq office"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Joining date</label>
                  <input
                    type="date"
                    value={createForm.joiningDate}
                    onChange={(e) => setCreateForm({ ...createForm, joiningDate: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 placeholder-slate-400 focus:border-neutral-900 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-neutral-500 ml-1">Access role</label>
                  <select
                    value={createForm.access_role}
                    onChange={(e) => setCreateForm({ ...createForm, access_role: e.target.value })}
                    className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:border-neutral-900 outline-none transition-all"
                  >
                    <option value="EMPLOYEE">Standard employee</option>
                    {HR_ACCESS_ROLES.filter((r) => r.value !== 'EMPLOYEE').map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {createFeedback && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 border text-xs font-semibold ${
                    createFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {createFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {createFeedback.text}
                </div>
              )}

              <div className="flex gap-3 border-t border-neutral-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3.5 border border-neutral-200 rounded-lg text-[10px] font-semibold hover:bg-neutral-50 text-neutral-600 transition-all"
                >
                  discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-neutral-900 text-white rounded-lg font-semibold text-[10px] shadow-sm hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  add employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetailModal && detailEmployee && (
        <EmployeeDetailModal
          employee={detailEmployee}
          allEmployees={employees}
          onClose={() => {
            setShowDetailModal(false);
            setDetailEmployee(null);
          }}
          onSaved={(updated) => {
            setEmployees((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
            setDetailEmployee((prev) => (prev ? { ...prev, ...updated } : prev));
          }}
        />
      )}

      {/* Access Role Modal */}
      {showRoleModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-modal scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="text-xs font-semibold text-neutral-800">Modify access role</h2>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedEmp(null);
                }}
                className="text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateRoleSubmit} className="p-8 space-y-6">
              <div className="border-b border-neutral-200 pb-2.5 mb-4 leading-none">
                <span className="block text-[9px] font-semibold text-neutral-500">Selected profile</span>
                <span className="text-xs font-semibold text-neutral-800 mt-1.5 block">{selectedEmp.name}</span>
                <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                  {selectedEmp.employeeId} · {selectedEmp.email}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-neutral-500 ml-1">Access role</label>
                <select
                  className="w-full px-5 py-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:border-neutral-900 outline-none transition-all"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="EMPLOYEE">Standard employee</option>
                  {HR_ACCESS_ROLES.filter((r) => r.value !== 'EMPLOYEE').map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 border-t border-neutral-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedEmp(null);
                  }}
                  className="flex-1 py-3.5 border border-neutral-200 rounded-lg text-[10px] font-semibold hover:bg-neutral-50 text-neutral-600 transition-all"
                >
                  discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-neutral-900 text-white rounded-lg font-semibold text-[10px] shadow-sm hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
