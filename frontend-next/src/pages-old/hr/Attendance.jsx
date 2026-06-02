'use client';

import { useState, useEffect } from 'react';
import {
  Fingerprint,
  RefreshCw,
  Activity,
  Trash2,
  Loader2,
  Check,
  MapPin,
  Wifi,
  Plus,
  X,
  Calendar,
  Search,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '../../lib/stores/authStore';
import { mergeDeviceUserBatches } from '../../lib/biometric/enrolled-merge';
import {
  getDevices,
  createDevice,
  deleteDevice,
  getAttendanceSettings,
  updateAttendanceSettings,
  getBiometricUsers,
  getAttendanceEvents,
  processBiometricLogs,
  submitRemoteClockIn,
  getTeamCalendar,
  getNetworks,
  createNetwork,
  deleteNetwork,
  getRegularizations,
  requestRegularization,
  processRegularization
} from '../../services/hrApi';

export default function Attendance() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('calendar');
  const [devices, setDevices] = useState([]);
  const [networksList, setNetworksList] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState({ attendance_mode: 'biometric', enable_ip_validation: true });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab 1: Calendar State
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Tab 2: Remote Clock-in State
  const [remoteStatus, setRemoteStatus] = useState(null);

  // Tab 3: Biometric state
  const [newDevice, setNewDevice] = useState({ device_name: '', deviceIp: '' });
  const [biometricUsers, setBiometricUsers] = useState([]);
  const [selectedDeviceIp, setSelectedDeviceIp] = useState('');

  // Tab 4: Network IP state
  const [newNetwork, setNewNetwork] = useState({ label: '', ip_address_or_range: '' });

  // Regularization modal state
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regularizations, setRegularizations] = useState([]);
  const [regForm, setRegForm] = useState({ date: '', type: 'check-in', time: '', reason: '' });

  // Load Initial Data
  useEffect(() => {
    fetchCalendar();
    fetchDevicesAndNetworks();
    fetchAttendanceSettings();
    fetchRegularizationsList();
  }, [selectedMonth, selectedYear]);

  const fetchCalendar = async () => {
    try {
      const res = await getTeamCalendar(selectedMonth, selectedYear);
      if (res.success) {
        setCalendarData(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    }
  };

  const fetchDevicesAndNetworks = async () => {
    try {
      const [devRes, netRes, evRes] = await Promise.all([
        getDevices(),
        getNetworks(),
        getAttendanceEvents()
      ]);
      if (devRes.success) setDevices(devRes.data || []);
      if (netRes.success) setNetworksList(netRes.data || []);
      if (evRes.success) setEvents(evRes.data || []);
    } catch (err) {
      console.error('Failed to fetch devices/networks:', err);
    }
  };

  const fetchAttendanceSettings = async () => {
    try {
      const res = await getAttendanceSettings();
      if (res.success) setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRegularizationsList = async () => {
    try {
      const res = await getRegularizations();
      if (res.success) setRegularizations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (field, value) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    try {
      await updateAttendanceSettings(updated);
      showSuccess('Settings updated successfully');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.device_name || !newDevice.deviceIp) return;
    setSubmitting(true);
    try {
      const res = await createDevice({
        device_id: newDevice.deviceIp,
        device_name: newDevice.device_name,
        device_ip: newDevice.deviceIp,
        deviceIp: newDevice.deviceIp
      });
      if (res.success) {
        setDevices([...devices, res.data]);
        setNewDevice({ device_name: '', deviceIp: '' });
        showSuccess('Device added successfully');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      await deleteDevice(id);
      setDevices(devices.filter(d => d.id !== id));
      showSuccess('Device removed successfully');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAddNetwork = async (e) => {
    e.preventDefault();
    if (!newNetwork.label || !newNetwork.ip_address_or_range) return;
    setSubmitting(true);
    try {
      const res = await createNetwork(newNetwork);
      if (res.success) {
        setNetworksList([...networksList, res.data]);
        setNewNetwork({ label: '', ip_address_or_range: '' });
        showSuccess('IP range whitelisted successfully');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNetwork = async (id) => {
    try {
      await deleteNetwork(id);
      setNetworksList(networksList.filter(n => n.id !== id));
      showSuccess('IP range removed successfully');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleProcessLogs = async () => {
    setLoading(true);
    try {
      const res = await processBiometricLogs();
      if (res.success) {
        showSuccess(`Biometric logs processed successfully! Enrolled logs parsed.`);
        fetchDevicesAndNetworks();
        fetchCalendar();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteClockIn = async (isCheckOut) => {
    setLoading(true);
    try {
      const res = await submitRemoteClockIn({
        employeeId: user.email || 'jane.admin@onecrm.com',
        ip: '192.168.1.105',
        coordinates: '41.8781° N, 87.6298° W',
        isCheckOut
      });
      if (res.success) {
        setRemoteStatus(res.data);
        showSuccess(`Successfully clocked ${isCheckOut ? 'out' : 'in'} remotely!`);
        fetchCalendar();
        fetchDevicesAndNetworks();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRegularization = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await requestRegularization({
        employeeId: user.email || 'jane.admin@onecrm.com',
        ...regForm
      });
      if (res.success) {
        setRegForm({ date: '', type: 'check-in', time: '', reason: '' });
        setIsRegModalOpen(false);
        showSuccess('Regularization request submitted');
        fetchRegularizationsList();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessReg = async (id, status) => {
    try {
      const res = await processRegularization(id, status, 'Approved by Supervisor');
      if (res.success) {
        showSuccess(`Request ${status.toLowerCase()} successfully`);
        fetchRegularizationsList();
        fetchCalendar();
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // Helper to draw calendar
  const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
  const daysCount = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  return (
    <section className="space-y-6">
      {/* Toast notifications */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <Check size={18} />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-500 text-white px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <X size={18} />
          <span className="text-xs font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Card Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 text-slate-800 p-8 rounded-[28px] shadow-sm relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-[10px] font-semibold">HR Module</span>
            <span className="bg-slate-100 text-slate-650 px-3 py-1 rounded-full text-[10px] font-semibold">Attendance</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">Biometrics & Clock-Ins</h1>
          <p className="text-slate-500 text-xs max-w-xl">Manage hardware endpoints, IP whitelists, regularization appeals, and visualize actual check-in data.</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button
            onClick={() => setIsRegModalOpen(true)}
            className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all"
          >
            Appeal Regularization
          </button>
          <button
            onClick={handleProcessLogs}
            disabled={loading}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Activity size={14} />}
            Process Biometric Logs
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'calendar', label: 'Team Calendar', icon: Calendar },
          { id: 'remote', label: 'Remote Clock-in', icon: MapPin },
          { id: 'biometric', label: 'Hardware Registry', icon: Fingerprint },
          { id: 'networks', label: 'IP Networks Whitelist', icon: Wifi }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 border-b-2 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Body */}
      <div className="bg-white border border-slate-200/80 p-8 rounded-[28px] shadow-sm">

        {/* Tab 1: Calendar */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Live Pulse Calendar</h3>
                <p className="text-xs text-slate-500">Visual matrix of monthly check-ins. Click appeal above for regularizations.</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            {/* Grid display */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    <th className="py-4 px-5 text-[10px] font-semibold text-slate-500 w-56 sticky left-0 bg-slate-50 border-r border-slate-200">Employee</th>
                    {daysArray.map(day => (
                      <th key={day} className="py-3 px-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-100 last:border-0 min-w-[36px]">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calendarData.map(emp => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 font-semibold text-xs text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                        <div>
                          <p>{emp.name}</p>
                          <p className="text-[9px] font-medium text-slate-400">{emp.employeeId} · {emp.department}</p>
                        </div>
                      </td>
                      {daysArray.map(day => {
                        const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const record = emp.records?.find(r => r.date === dayStr);

                        let pillClass = 'bg-slate-50 text-slate-300 border-transparent';
                        let symbol = '—';
                        if (record) {
                          if (record.status === 'PRESENT') {
                            pillClass = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                            symbol = 'P';
                          } else if (record.status === 'LATE') {
                            pillClass = 'bg-amber-50 text-amber-600 border-amber-200';
                            symbol = 'L';
                          } else if (record.status === 'ABSENT') {
                            pillClass = 'bg-rose-50 text-rose-600 border-rose-200';
                            symbol = 'A';
                          } else if (record.status === 'HALF_DAY') {
                            pillClass = 'bg-purple-50 text-purple-600 border-purple-200';
                            symbol = 'H';
                          }
                        }

                        return (
                          <td key={day} className="p-1 border-r border-slate-100 last:border-0 text-center">
                            <div
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-black mx-auto cursor-default transition-all hover:scale-110 ${pillClass}`}
                              title={record ? `${record.status} (In: ${record.check_in ? new Date(record.check_in).toLocaleTimeString() : 'N/A'}, Out: ${record.check_out ? new Date(record.check_out).toLocaleTimeString() : 'N/A'})` : 'No Entry'}
                            >
                              {symbol}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {calendarData.length === 0 && (
                    <tr>
                      <td colSpan={daysCount + 1} className="py-12 text-center text-xs font-semibold text-slate-400">No employee attendance calendar data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400">Status Legend:</span>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-[9px] font-semibold">P</div><span className="text-[10px] font-semibold text-slate-600">Present</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-[9px] font-semibold">L</div><span className="text-[10px] font-semibold text-slate-600">Late Check-in</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-[9px] font-semibold">A</div><span className="text-[10px] font-semibold text-slate-600">Absent</span></div>
              <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center text-[9px] font-semibold">H</div><span className="text-[10px] font-semibold text-slate-600">Half Day</span></div>
            </div>

            {/* List of Regularization appeals */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400">Active Appeal Decisions</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {regularizations.map(reg => (
                  <div key={reg.id} className="p-5 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{reg.name} ({reg.type})</p>
                      <p className="text-[10px] text-slate-500">Requested date: {reg.date} at {reg.time} · Reason: {reg.reason}</p>
                      {reg.approverRemarks && <p className="text-[9px] text-slate-400 italic">Approver: {reg.approverRemarks}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {reg.status === 'PENDING' ? (
                        user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProcessReg(reg.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-semibold rounded-lg hover:bg-emerald-600 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessReg(reg.id, 'REJECTED')}
                              className="px-3 py-1.5 bg-rose-500 text-white text-[9px] font-semibold rounded-lg hover:bg-rose-600 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-[9px] font-semibold">Pending</span>
                        )
                      ) : reg.status === 'APPROVED' ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-[9px] font-semibold">Approved</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full text-[9px] font-semibold">Rejected</span>
                      )}
                    </div>
                  </div>
                ))}
                {regularizations.length === 0 && (
                  <p className="p-8 text-center text-xs text-slate-400 font-semibold">No active regularization requests</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Remote Clock-in */}
        {activeTab === 'remote' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Virtual Geofencing Terminal</h3>
                <p className="text-xs text-slate-500">Perform real-time check-in and check-out logs simulating office VPN or remote coordinates.</p>
              </div>

              {/* Status Display Card */}
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Current Session Status</p>
                    <h4 className="text-sm font-semibold text-slate-800 tracking-tight">{user?.name} · {user?.role}</h4>
                  </div>
                </div>

                <div className="h-px bg-slate-200/60 w-full"></div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Last Action Status</span>
                    {remoteStatus ? (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] inline-block mt-1">Active Check-In</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[9px] inline-block mt-1">No Active Shift</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Registered IP / Coordinates</span>
                    <span className="font-mono text-[10px] block mt-1 text-slate-500">192.168.1.105 (41.8781° N)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleRemoteClockIn(false)}
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-md transition-all disabled:opacity-50"
                >
                  Remote Check-In
                </button>
                <button
                  onClick={() => handleRemoteClockIn(true)}
                  disabled={loading}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-2xl shadow-md transition-all disabled:opacity-50"
                >
                  Remote Check-Out
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-semibold text-slate-400">Live Device Logs Broadcast</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[300px] overflow-y-auto no-scrollbar">
                {events.map((ev, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800">{ev.employeeName || 'Staff Member'}</p>
                      <p className="text-[10px] text-slate-400">Date: {ev.date} · Device ID: {ev.device_id || 'System'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${ev.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        ev.status === 'LATE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                      {ev.status}
                    </span>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="p-8 text-center text-xs text-slate-400 font-semibold">No attendance logs processed yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Biometric Registry */}
        {activeTab === 'biometric' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Active Biometric Hardware Registry</h3>
                  <p className="text-xs text-slate-500">Monitor whitelisted local fingerprint, card, or face recognition terminals.</p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {devices.map(d => (
                    <div key={d.id} className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                          <Fingerprint size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm tracking-tight">{d.deviceName}</p>
                          <p className="text-[10px] font-mono font-semibold text-slate-400">{d.deviceIp} · ONLINE</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDevice(d.id)}
                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-2 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {devices.length === 0 && (
                    <div className="p-16 text-center text-slate-400 text-[10px] font-semibold">No biometric hardware registered</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6 h-fit">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Register Hardware</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Whitelist Local Terminal IP</p>
                </div>
                <form onSubmit={handleAddDevice} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400">Device Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lobby Terminal"
                      value={newDevice.device_name}
                      onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary/50 transition-all text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400">Device IP</label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.150"
                      value={newDevice.deviceIp}
                      onChange={(e) => setNewDevice({ ...newDevice, deviceIp: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary/50 transition-all text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    Whitelist Device
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Network IP Whitelist */}
        {activeTab === 'networks' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Whitelisted IP Networks</h3>
                  <p className="text-xs text-slate-500">Configure Wi-Fi IP ranges or VPN subnets allowed to execute remote check-ins.</p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {networksList.map(n => (
                    <div key={n.id} className="p-6 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-colors group">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                          <Wifi size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm tracking-tight">{n.label}</p>
                          <p className="text-[10px] font-mono font-semibold text-slate-400">{n.ip_address_or_range} · {n.is_active ? 'ACTIVE' : 'INACTIVE'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNetwork(n.id)}
                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-2 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {networksList.length === 0 && (
                    <div className="p-16 text-center text-slate-400 text-[10px] font-semibold">No whitelisted IP ranges registered</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6 h-fit">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Whitelist Network</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Whitelist Office IP Network</p>
                </div>
                <form onSubmit={handleAddNetwork} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400">Network Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Office Wi-Fi Range"
                      value={newNetwork.label}
                      onChange={(e) => setNewNetwork({ ...newNetwork, label: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary/50 transition-all text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400">IP Network Subnet</label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.0/24"
                      value={newNetwork.ip_address_or_range}
                      onChange={(e) => setNewNetwork({ ...newNetwork, ip_address_or_range: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary/50 transition-all text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    Whitelist Net Range
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Regularization Modal Appeal form */}
      {isRegModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-[28px] shadow-2xl p-8 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-900 transition-colors p-1"
            >
              <X size={20} />
            </button>
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Appeal Regularization</h3>
              <p className="text-xs text-slate-400 font-semibold">Appeal attendance entry adjustments</p>
            </div>
            <form onSubmit={handleRequestRegularization} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Adjust Target Date</label>
                <input
                  type="date"
                  value={regForm.date}
                  onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-primary/50 text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Adjustment Slot</label>
                <select
                  value={regForm.type}
                  onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-primary/50 text-slate-800"
                >
                  <option value="check-in">Check-in</option>
                  <option value="check-out">Check-out</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Time (HH:MM)</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00"
                  value={regForm.time}
                  onChange={(e) => setRegForm({ ...regForm, time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-primary/50 text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Appeal Remarks / Reason</label>
                <textarea
                  placeholder="e.g. Scanner was unresponsive"
                  value={regForm.reason}
                  onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-primary/50 text-slate-800 h-20 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 text-white font-semibold text-xs rounded-2xl shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                Submit Appeal Request
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
