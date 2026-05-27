'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Upload, 
  Trash2, 
  Download, 
  User, 
  FolderOpen, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  getEmployees, 
  getEmployeeDocuments, 
  uploadEmployeeDocument, 
  deleteEmployeeDocument 
} from '../../services/hrApi';

export default function DocumentManagement() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Offer Letter');
  const [docFileString, setDocFileString] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  // Predefined document tags
  const documentTypes = [
    'Offer Letter',
    'NDA / Agreement',
    'ID Proof',
    'Tax Document',
    'Salary Slip',
    'Degree Certificate',
    'Other'
  ];

  // Fetch employees list
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoading(true);
        const res = await getEmployees();
        if (res.success && res.data) {
          setEmployees(res.data);
          // Default selection to first employee
          if (res.data.length > 0) {
            setSelectedEmployee(res.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load employees for documents", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployees();
  }, []);

  // Fetch documents whenever selectedEmployee changes
  useEffect(() => {
    if (!selectedEmployee) {
      setDocuments([]);
      return;
    }
    const loadDocs = async () => {
      try {
        const res = await getEmployeeDocuments(selectedEmployee.id);
        if (res.success) {
          setDocuments(res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch documents for selected employee:", err);
      }
    };
    loadDocs();
  }, [selectedEmployee]);

  // Handle mock file conversion to base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!docName) {
      setDocName(file.name.split('.')[0]);
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocFileString(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      alert("Please select an employee first");
      return;
    }
    if (!docName.trim()) {
      alert("Please enter a document name");
      return;
    }

    const docPayload = {
      name: docName.trim(),
      type: docType,
      fileSize: "1.4 MB",
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await uploadEmployeeDocument(selectedEmployee.id, docPayload);
      if (res.success) {
        // Refresh local docs
        const freshDocs = await getEmployeeDocuments(selectedEmployee.id);
        setDocuments(freshDocs.data || []);
        
        // Clear input states
        setDocName('');
        setDocFileString('');
        setActionStatus('Document uploaded and indexed successfully.');
        setTimeout(() => setActionStatus(''), 4000);
      } else {
        alert("Failed to upload document");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading document");
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document from corporate files?")) return;
    try {
      const res = await deleteEmployeeDocument(selectedEmployee.id, docId);
      if (res.success) {
        // Refresh local list
        const freshDocs = await getEmployeeDocuments(selectedEmployee.id);
        setDocuments(freshDocs.data || []);
        setActionStatus('Document deleted successfully.');
        setTimeout(() => setActionStatus(''), 4000);
      } else {
        alert("Failed to delete document");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting document");
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      {/* Title Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
          <FolderOpen className="text-indigo-600" size={32} />
          Enterprise Document & Compliance Registry
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Secure multi-tenant lifecycle storage for employees' NDA agreements, compliance files, and credential uploads.
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Action Status Notification Banner */}
        {actionStatus && (
          <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center gap-3 text-indigo-600 animate-in fade-in duration-200">
            <Sparkles size={18} />
            <span className="text-xs font-semibold">{actionStatus}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
          
          {/* LEFT SIDEBAR: Personnel Directory Search */}
          <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm shrink-0">
            <div className="p-6 border-b border-slate-200 bg-slate-50/40">
              <h4 className="text-[11px] font-semibold text-slate-500 mb-3 uppercase tracking-wider">Staff Directory</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter personnel..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:border-indigo-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none divide-y divide-slate-100 no-scrollbar">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading directory...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No personnel matches found.</div>
              ) : (
                filteredEmployees.map(emp => {
                  const isSelected = selectedEmployee?.id === emp.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`w-full p-4 text-left border-l-4 transition-all flex items-center gap-3 relative ${
                        isSelected 
                          ? 'bg-indigo-50/50 border-l-indigo-600' 
                          : 'border-l-transparent hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-650' : 'text-slate-700'}`}>
                          {emp.name}
                        </p>
                        <p className="text-[9px] text-slate-450 truncate mt-0.5">
                          {emp.designation} • {emp.department}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT VIEW: File Upload & Catalog */}
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
            
            {/* Header info */}
            {selectedEmployee ? (
              <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-800">{selectedEmployee.name}</h3>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    {selectedEmployee.employeeId} — {selectedEmployee.designation} ({selectedEmployee.department})
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Please select an employee record on the left to review files.
              </div>
            )}

            {selectedEmployee && (
              <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8">
                
                {/* Section 1: Upload Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
                    <Upload size={14} className="text-indigo-650" />
                    Upload & Archive New Document
                  </h4>

                  <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Document Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. signed_nda_agreement"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-500 outline-none transition-all"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Category Tag</label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-indigo-500 outline-none transition-all"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                      >
                        {documentTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Attachment File</label>
                      <div className="flex gap-3">
                        <label className="flex-1 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer rounded-xl text-xs text-slate-500 font-semibold flex items-center justify-center gap-2 transition-all">
                          <Upload size={14} />
                          {docFileString ? 'File Chosen' : 'Choose PDF/Image'}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,image/*" 
                            onChange={handleFileChange}
                          />
                        </label>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                        >
                          Archive File
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Section 2: Catalog List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <FolderOpen size={14} className="text-indigo-600" />
                    Archived Documents Log ({documents.length})
                  </h4>

                  {documents.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="text-slate-400" size={32} />
                      <p className="text-xs font-semibold text-slate-400">No active documents on file for this employee.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="p-5 rounded-2xl border bg-slate-50 border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700 truncate max-w-[200px] uppercase tracking-wider">
                                {doc.name}
                              </p>
                              <span className="inline-block px-2 py-0.5 bg-slate-205 text-indigo-600 rounded-md text-[8px] font-extrabold tracking-widest uppercase mt-1">
                                {doc.type}
                              </span>
                              <div className="flex items-center gap-3 text-[10px] text-slate-450 mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {doc.uploadedAt}
                                </span>
                                <span>•</span>
                                <span>{doc.fileSize || '1.2 MB'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => alert(`Simulating Secure Download: ${doc.name} (128-bit key verified)`)}
                              className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                              title="Download File"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-655 rounded-xl transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
