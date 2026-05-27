'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Upload, 
  Trash2, 
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
  ClipboardCheck
} from 'lucide-react';
import { 
  getEmployees, 
  assignAccessRole, 
  bulkImportEmployees,
  createEmployee,
  updateEmployee,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument
} from '../../services/hrApi';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Overlays
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [newRole, setNewRole] = useState('EMPLOYEE');

  // Side Drawer detail panel
  const [selectedEmployeeForDrawer, setSelectedEmployeeForDrawer] = useState(null);
  const [drawerTab, setDrawerTab] = useState('details'); // 'details' | 'documents'
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form edit state
  const [editForm, setEditForm] = useState({
    dob: '',
    address: '',
    emergencyContact: '',
    hireDate: '',
    designation: '',
    department: '',
    phone: '',
    location: '',
    employmentStatus: 'Active'
  });

  // Add Employee modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: 'Operations',
    designation: '',
    phone: '',
    location: '',
    access_role: 'EMPLOYEE',
    employmentStatus: 'Active',
  });

  // Bulk Upload Panel state
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const [importFeedback, setImportFeedback] = useState(null);

  // Load Directory
  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      if (res.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch employee directory:', err);
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
        setEmployees(employees.map(emp => emp.id === selectedEmp.id ? { ...emp, access_role: newRole } : emp));
        setShowRoleModal(false);
        setSelectedEmp(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenDrawer = async (emp) => {
    setSelectedEmployeeForDrawer(emp);
    setDrawerTab('details');
    setEditForm({
      dob: emp.dob || '',
      address: emp.address || '',
      emergencyContact: emp.emergencyContact || '',
      hireDate: emp.hireDate || '',
      designation: emp.designation || '',
      department: emp.department || '',
      phone: emp.phone || '',
      location: emp.location || '',
      employmentStatus: emp.employmentStatus || 'Active'
    });
    fetchDocuments(emp.id);
  };

  const fetchDocuments = async (empId) => {
    setDocsLoading(true);
    try {
      const res = await getEmployeeDocuments(empId);
      if (res.success) {
        setDocuments(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleUpdateDetails = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEmployeeForDrawer) return;
    setSubmitting(true);
    try {
      const res = await updateEmployee(selectedEmployeeForDrawer.id, editForm);
      if (res.success) {
        setEmployees(employees.map(emp => emp.id === selectedEmployeeForDrawer.id ? res.data : emp));
        setSelectedEmployeeForDrawer(res.data);
        alert('Employee details updated successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update employee details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedEmployeeForDrawer) return;
    setUploadingDoc(true);
    try {
      const docPayload = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      };
      const res = await uploadEmployeeDocument(selectedEmployeeForDrawer.id, docPayload);
      if (res.success) {
        await fetchDocuments(selectedEmployeeForDrawer.id);
        alert('Document uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocDelete = async (docId) => {
    if (!selectedEmployeeForDrawer) return;
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await deleteEmployeeDocument(selectedEmployeeForDrawer.id, docId);
      if (res.success) {
        await fetchDocuments(selectedEmployeeForDrawer.id);
        alert('Document deleted successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
    }
  };
  // CSV/Tabular Paste Parser
  const handleParsePaste = () => {
    if (!pasteData.trim()) return;
    
    // Split lines
    const lines = pasteData.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert('Pasted content must include a header row and at least one data row.');
      return;
    }

    // Parse delimiter (auto-detect Tab or Comma)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    
    // Parse headers
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Header alias indexes
    const idxEmail = headers.findIndex(h => h.includes('email'));
    const idxName = headers.findIndex(h => h.includes('name') || h.includes('first'));
    const idxLastName = headers.findIndex(h => h.includes('last'));
    const idxEmpId = headers.findIndex(h => h.includes('id') || h.includes('code'));
    const idxRole = headers.findIndex(h => h.includes('role'));
    const idxDept = headers.findIndex(h => h.includes('dept') || h.includes('department'));
    const idxDesig = headers.findIndex(h => h.includes('title') || h.includes('designation'));
    const idxLocation = headers.findIndex(h => h.includes('location') || h.includes('office'));
    const idxPhone = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));

    const rows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim());
      
      let email = idxEmail !== -1 ? cols[idxEmail] : '';
      let firstName = idxName !== -1 ? cols[idxName] : '';
      let lastName = idxLastName !== -1 ? cols[idxLastName] : '';
      let employeeId = idxEmpId !== -1 ? cols[idxEmpId] : '';
      let access_role = idxRole !== -1 ? cols[idxRole].toUpperCase() : 'EMPLOYEE';
      let department = idxDept !== -1 ? cols[idxDept] : 'Operations';
      let designation = idxDesig !== -1 ? cols[idxDesig] : 'Staff Member';
      let location = idxLocation !== -1 ? cols[idxLocation] : 'HQ Office';
      let phone = idxPhone !== -1 ? cols[idxPhone] : '';

      // Clean up fields
      let name = firstName;
      if (lastName) name += ' ' + lastName;
      if (!name) name = email ? email.split('@')[0] : 'Unnamed Staff';

      const errors = [];
      if (!email) errors.push('Missing Email');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid Email Format');
      if (!employeeId) errors.push('Missing ID');

      const isRowValid = errors.length === 0;
      if (isRowValid) validCount++;
      else invalidCount++;

      rows.push({
        rowNum: i + 1,
        data: { name, email, employeeId, access_role, department, designation, location, phone },
        errors,
        isValid: isRowValid
      });
    }

    setParsedRows(rows);
    setImportSummary({
      total: rows.length,
      valid: validCount,
      invalid: invalidCount
    });
  };

  const handleCommitImport = async () => {
    const validPayloads = parsedRows.filter(r => r.isValid).map(r => r.data);
    if (validPayloads.length === 0) return;
    
    setSubmitting(true);
    setImportFeedback(null);
    try {
      const res = await bulkImportEmployees(validPayloads);
      if (res.success) {
        setImportFeedback({ type: 'success', text: `Imported ${res.count || validPayloads.length} new records successfully.` });
        setPasteData('');
        setParsedRows([]);
        setImportSummary(null);
        await fetchDirectory();
      } else {
        setImportFeedback({ type: 'error', text: res.error || 'Failed to complete bulk import.' });
      }
    } catch (err) {
      console.error(err);
      setImportFeedback({ type: 'error', text: 'Connection error during directory import.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createEmployee(newEmployee);
      if (res.success) {
        setShowAddModal(false);
        setNewEmployee({
          name: '', email: '', employeeId: '', department: 'Operations',
          designation: '', phone: '', location: '', access_role: 'EMPLOYEE', employmentStatus: 'Active',
        });
        await fetchDirectory();
      }
    } catch (err) {
      alert(err.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.department || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || emp.employmentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      {/* Title */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">
            Staff & Employee Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Maintain institutional profiles, update enterprise security roles, and bulk ingest personnel data.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-all"
          >
            <Plus size={14} /> Add New Employee
          </button>
          <button 
            onClick={() => {
              setShowBulkPanel(!showBulkPanel);
              setImportFeedback(null);
              setParsedRows([]);
              setImportSummary(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md ${
              showBulkPanel
                ? 'bg-slate-200 border border-slate-300 text-slate-700 hover:bg-slate-300'
                : 'bg-indigo-600 text-white shadow-indigo-600/10 hover:scale-[1.01] hover:shadow-lg hover:bg-indigo-700'
            }`}
          >
            {showBulkPanel ? <Users size={14} /> : <Upload size={14} />}
            {showBulkPanel ? 'View Directory' : 'Bulk Ingest Staff'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {!showBulkPanel ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search and summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter personnel by name, email, department, or ID..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-650 outline-none focus:border-indigo-600 appearance-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                </select>
                <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-semibold text-slate-600 shrink-0">
                  {filteredEmployees.length} Account{filteredEmployees.length !== 1 ? 's' : ''} Listed
                </div>
              </div>
            </div>

            {/* Directory Cards Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-550">
                      <th className="px-6 py-4">University ID</th>
                      <th className="px-6 py-4">Personnel</th>
                      <th className="px-6 py-4">Lifecycle Status</th>
                      <th className="px-6 py-4">Contact Information</th>
                      <th className="px-6 py-4">Organization Profile</th>
                      <th className="px-6 py-4">Biometric ID</th>
                      <th className="px-6 py-4">Access Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                          <p className="text-[10px] font-semibold text-slate-500 mt-2">Loading Directory...</p>
                        </td>
                      </tr>
                    ) : filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-all duration-200 cursor-pointer" onClick={() => handleOpenDrawer(emp)}>
                          <td className="px-6 py-5 text-xs font-mono font-semibold text-indigo-600">
                            {emp.employeeId || `EMP-${emp.id.substring(0, 4)}`}
                          </td>
                          <td className="px-6 py-5">
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{emp.name}</p>
                              <p className="text-[9px] text-slate-450 font-semibold mt-1 flex items-center gap-1">
                                <MapPin size={10} className="text-slate-400" /> {emp.location || 'HQ Office'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border ${
                              emp.employmentStatus === 'Active'
                                ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                : emp.employmentStatus === 'On Leave'
                                  ? 'bg-amber-50 border-amber-250 text-amber-700'
                                  : emp.employmentStatus === 'Resigned'
                                    ? 'bg-slate-100 border-slate-200 text-slate-655'
                                    : 'bg-red-50 border-red-250 text-red-700'
                            }`}>
                              {emp.employmentStatus || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1 text-xs">
                              <p className="text-slate-650 flex items-center gap-1.5 font-medium lowercase">
                                <Mail size={11} className="text-slate-400" /> {emp.email}
                              </p>
                              {emp.phone && (
                                <p className="text-slate-500 flex items-center gap-1.5 font-mono">
                                  <Phone size={11} className="text-slate-400" /> {emp.phone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1 text-xs">
                              <p className="text-slate-800 flex items-center gap-1.5 font-semibold">
                                <Briefcase size={11} className="text-slate-400" /> {emp.designation || 'Staff Member'}
                              </p>
                              <p className="text-[10px] text-slate-450 flex items-center gap-1.5 font-semibold">
                                <Building2 size={11} className="text-slate-400" /> {emp.department || 'Operations'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs font-mono font-semibold text-slate-500" onClick={(e) => e.stopPropagation()}>
                            <span className="flex items-center gap-1 text-[10px]">
                              <Fingerprint size={12} className="text-slate-400" />
                              {emp.biometricId || emp.employeeId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                            <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border flex items-center gap-1 w-fit ${
                              emp.access_role?.includes('ADMIN')
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : emp.access_role?.includes('HR')
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              <Shield size={11} className="opacity-80" />
                              {emp.access_role?.replace('_', ' ') || 'EMPLOYEE'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleOpenDrawer(emp)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-semibold transition-all shadow-sm shrink-0"
                            >
                              Manage Profile
                            </button>
                            <button 
                               onClick={() => {
                                 setSelectedEmp(emp);
                                 setNewRole(emp.access_role || 'EMPLOYEE');
                                 setShowRoleModal(true);
                               }}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl text-[9px] font-semibold transition-all shrink-0"
                            >
                              Role Access
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400 italic">
                          No personnel registered in the database catalog.
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
            {/* Bulk parsing screen */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Paste area & instructions */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 lg:col-span-1 h-fit">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-xs font-semibold text-slate-800">Spreadsheet Copier</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Copy and paste rows direct from MS Excel or Google Sheets.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 ml-1">Tabular Raw Data</label>
                    <textarea
                      rows={10}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-mono text-slate-700 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all no-scrollbar"
                      placeholder={`employeeId\tfirstName\tlastName\temail\tdepartment\tdesignation\tlocation\tphone\nE005\tJohn\tDoe\tjohn.doe@onecrm.com\tEngineering\tSoftware Engineer\tHQ Office\t9876543210`}
                      value={pasteData}
                      onChange={(e) => setPasteData(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleParsePaste}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] tracking-[0.2em] shadow-sm hover:scale-[1.01] hover:shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ClipboardCheck size={14} />
                    Auto-Validate Rows
                  </button>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2 text-[10px] text-slate-550 leading-normal">
                  <p className="font-semibold text-slate-700">Excel Header Keys:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>employeeId <span className="text-slate-400">(required)</span></li>
                    <li>firstName, lastName <span className="text-slate-400">(or name)</span></li>
                    <li>email <span className="text-slate-400">(required)</span></li>
                    <li>department, designation</li>
                    <li>location, phone, role</li>
                  </ul>
                </div>
              </div>

              {/* Preview Ingestion grid */}
              <div className="lg:col-span-2 space-y-6">
                {importSummary && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-6">
                    <div className="flex gap-8 text-xs font-semibold text-slate-500">
                      <div>Parsed: <span className="text-slate-800 font-semibold">{importSummary.total}</span></div>
                      <div>Valid: <span className="text-emerald-600 font-semibold">{importSummary.valid}</span></div>
                      <div>Flagged: <span className="text-red-500 font-semibold">{importSummary.invalid}</span></div>
                    </div>

                    <button
                      onClick={handleCommitImport}
                      disabled={submitting || importSummary.valid === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-[10px] shadow-sm hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 size={13} className="animate-spin inline" /> : <CheckCircle2 size={13} className="inline mr-1.5" />}
                      Ingest Verified Accounts
                    </button>
                  </div>
                )}

                {importFeedback && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    importFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250/20'
                      : 'bg-red-50 text-red-700 border-red-250/20'
                  }`}>
                    {importFeedback.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0" />
                    )}
                    <span className="text-xs font-semibold">{importFeedback.text}</span>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-8 py-5 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-650">Ingestion Sheet Preview</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                          <th className="px-6 py-4">Row</th>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Personnel</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Department / Designation</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Status / Validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.length > 0 ? (
                          parsedRows.map((row, idx) => (
                            <tr key={idx} className={`transition-colors ${
                              row.isValid ? 'hover:bg-slate-50/50' : 'bg-red-50 hover:bg-red-100/50'
                            }`}>
                              <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-400">
                                {row.rowNum}
                              </td>
                              <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-700">
                                {row.data.employeeId || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                                {row.data.name}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                {row.data.email || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                {row.data.designation} · <span className="text-[10px] font-semibold text-slate-450">{row.data.department}</span>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-550">
                                {row.data.access_role}
                              </td>
                              <td className="px-6 py-4">
                                {row.isValid ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-[8px] font-semibold rounded-lg">Verified</span>
                                ) : (
                                  <div className="space-y-0.5">
                                    {row.errors.map((err, eidx) => (
                                      <span key={eidx} className="block text-[8px] font-semibold text-red-500 tracking-tight flex items-center gap-0.5">
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
                            <td colSpan={7} className="px-6 py-16 text-center text-xs text-slate-450 italic">
                              <FileSpreadsheet size={32} className="text-slate-300 mx-auto animate-bounce mb-3" />
                              Ingestion sheet is currently empty. Ingest values inside the copier panel on the left.
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

      {/* Access Role Modal */}
      {showRoleModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">Modify Access Permissions</h2>
              <button 
                onClick={() => { setShowRoleModal(false); setSelectedEmp(null); }} 
                className="text-slate-400 hover:text-slate-655 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateRoleSubmit} className="p-8 space-y-6">
              <div className="border-b border-slate-200 pb-2.5 mb-4 leading-none">
                <span className="block text-[9px] font-semibold text-slate-400">Selected Profile</span>
                <span className="text-xs font-semibold text-slate-800 mt-1.5 block">{selectedEmp.name}</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{selectedEmp.employeeId} · {selectedEmp.email}</span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 ml-1">Enterprise Role Assignment</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-850 focus:border-indigo-600 outline-none transition-all"
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="SUPER_ADMIN">Super Administrator</option>
                  <option value="GLOBAL_ADMIN">Global Administrator</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="PAYROLL_ADMIN">Payroll Administrator</option>
                  <option value="MANAGER">Manager / Team Lead</option>
                  <option value="EMPLOYEE">Standard Employee</option>
                </select>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowRoleModal(false); setSelectedEmp(null); }}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-600 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] shadow-sm hover:scale-[1.01] hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  Deploy Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Side Drawer Detail Panel */}
      {selectedEmployeeForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl p-8 space-y-6 flex flex-col justify-between slide-in-from-right duration-350 transform transition-all font-sans">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-slate-150 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-indigo-900">{selectedEmployeeForDrawer.name}</h3>
                  <p className="text-xs text-indigo-650 font-semibold">{selectedEmployeeForDrawer.designation || 'Staff Member'} · {selectedEmployeeForDrawer.department || 'Operations'}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{selectedEmployeeForDrawer.employeeId} · {selectedEmployeeForDrawer.email}</p>
                </div>
                <button 
                  onClick={() => setSelectedEmployeeForDrawer(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setDrawerTab('details')}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                    drawerTab === 'details'
                      ? 'border-indigo-600 text-indigo-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Personal & Job Details
                </button>
                <button
                  onClick={() => setDrawerTab('documents')}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                    drawerTab === 'documents'
                      ? 'border-indigo-600 text-indigo-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Documents Catalog
                </button>
              </div>

              {/* Drawer Content */}
              {drawerTab === 'details' ? (
                <form onSubmit={handleUpdateDetails} className="space-y-4 text-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">Employment Status</label>
                    <select
                      value={editForm.employmentStatus}
                      onChange={(e) => setEditForm({ ...editForm, employmentStatus: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 cursor-pointer appearance-none"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Resigned">Resigned</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">Date of Birth</label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">Hire Date</label>
                      <input
                        type="date"
                        value={editForm.hireDate}
                        onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">Designation</label>
                      <input
                        type="text"
                        value={editForm.designation}
                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">Department</label>
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">Contact Phone</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">Office Location</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">Personal Address</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="e.g. 456 West Loop, Chicago IL"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 min-h-[70px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">Emergency Contact Details</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      placeholder="e.g. Sita Kalla (+1 312-555-0144)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-xs tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {submitting && <Loader2 size={12} className="animate-spin" />}
                    Save Profile Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Document Uploader Card */}
                  <div className="border border-dashed border-slate-350 bg-slate-50 rounded-2xl p-6 text-center space-y-4">
                    <div className="p-3 bg-white border border-slate-100 rounded-full w-fit mx-auto shadow-sm">
                      <Upload size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Upload Employee Documents</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Submit offer letters, background checks, ID proofs, or contracts.</p>
                    </div>
                    <div className="relative w-fit mx-auto">
                      <input 
                        type="file" 
                        id="employee-doc-upload" 
                        className="hidden" 
                        onChange={handleDocUpload}
                        disabled={uploadingDoc}
                      />
                      <label 
                        htmlFor="employee-doc-upload" 
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-650 rounded-xl text-[10px] font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {uploadingDoc ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                        Select File to Upload
                      </label>
                    </div>
                  </div>

                  {/* Document list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stored Files ({documents.length})</h4>
                    {docsLoading ? (
                      <div className="text-center py-6">
                        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={18} />
                      </div>
                    ) : documents.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                        {documents.map((doc) => (
                          <div key={doc.id} className="p-4 border border-slate-200 bg-white rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-slate-800 truncate max-w-[240px]">{doc.name}</p>
                              <div className="flex gap-2 text-[9px] text-slate-400 font-semibold uppercase">
                                <span>{doc.size || '1.2 MB'}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={() => alert(`Downloading Document: ${doc.name} (File catalog link mock active)`)}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 transition-all"
                              >
                                Download
                              </button>
                              <button 
                                onClick={() => handleDocDelete(doc.id)}
                                className="p-2 hover:bg-red-50 hover:text-red-600 border border-transparent rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-slate-100 bg-slate-50 rounded-2xl text-[10px] text-slate-400 italic font-semibold">
                        No official documents uploaded for this employee directory record.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-150 pt-4 mt-6">
              <button
                onClick={() => setSelectedEmployeeForDrawer(null)}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold text-slate-500 transition-all"
              >
                Close Profile Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-slate-800">Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Full Name</label>
                  <input required value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Employee ID</label>
                  <input required value={newEmployee.employeeId} onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Email</label>
                  <input required type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Department</label>
                  <select value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none">
                    <option>Operations</option><option>Engineering</option><option>Human Resources</option>
                    <option>Finance</option><option>Marketing</option><option>Counselling</option><option>Processing</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Designation</label>
                  <input value={newEmployee.designation} onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Phone</label>
                  <input value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 ml-1">Location</label>
                  <input value={newEmployee.location} onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600" />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Employee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
