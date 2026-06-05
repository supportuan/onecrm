'use client';

import { useState, useEffect } from 'react';
import {
  Fingerprint,
  RefreshCw,
  Activity,
  Trash2,
  Check,
  MapPin,
  Wifi,
  X,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../lib/stores/authStore';
import {
  getDevices,
  createDevice,
  deleteDevice,
  getAttendanceSettings,
  updateAttendanceSettings,
  getAttendanceEvents,
  processBiometricLogs,
  submitRemoteClockIn,
  getTeamCalendar,
  getNetworks,
  createNetwork,
  deleteNetwork,
  getRegularizations,
  requestRegularization,
  processRegularization,
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

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [remoteStatus, setRemoteStatus] = useState(null);
  const [newDevice, setNewDevice] = useState({ device_name: '', deviceIp: '' });
  const [newNetwork, setNewNetwork] = useState({ label: '', ip_address_or_range: '' });

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regularizations, setRegularizations] = useState([]);
  const [regForm, setRegForm] = useState({ date: '', type: 'check-in', time: '', reason: '' });

  useEffect(() => {
    fetchCalendar();
    fetchDevicesAndNetworks();
    fetchAttendanceSettings();
    fetchRegularizationsList();
  }, [selectedMonth, selectedYear]);

  const fetchCalendar = async () => {
    try {
      const res = await getTeamCalendar(selectedMonth, selectedYear);
      if (res.success) setCalendarData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    }
  };

  const fetchDevicesAndNetworks = async () => {
    try {
      const [devRes, netRes, evRes] = await Promise.all([getDevices(), getNetworks(), getAttendanceEvents()]);
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

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.device_name || !newDevice.deviceIp) return;
    setSubmitting(true);
    try {
      const res = await createDevice({
        device_id: newDevice.deviceIp,
        device_name: newDevice.device_name,
        device_ip: newDevice.deviceIp,
        deviceIp: newDevice.deviceIp,
      });
      if (res.success) {
        setDevices([...devices, res.data]);
        setNewDevice({ device_name: '', deviceIp: '' });
        showSuccess('device added successfully');
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
      setDevices(devices.filter((d) => d.id !== id));
      showSuccess('device removed');
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
        showSuccess('ip range whitelisted');
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
      setNetworksList(networksList.filter((n) => n.id !== id));
      showSuccess('ip range removed');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleProcessLogs = async () => {
    setLoading(true);
    try {
      const res = await processBiometricLogs();
      if (res.success) {
        showSuccess('biometric logs processed successfully');
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
        employeeId: user?.email || 'jane.admin@onecrm.com',
        ip: '192.168.1.105',
        coordinates: '41.8781° N, 87.6298° W',
        isCheckOut,
      });
      if (res.success) {
        setRemoteStatus(res.data);
        showSuccess(`successfully clocked ${isCheckOut ? 'out' : 'in'} remotely`);
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
        employeeId: user?.email || 'jane.admin@onecrm.com',
        ...regForm,
      });
      if (res.success) {
        setRegForm({ date: '', type: 'check-in', time: '', reason: '' });
        setIsRegModalOpen(false);
        showSuccess('regularization request submitted');
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
      const res = await processRegularization(id, status, 'approved by supervisor');
      if (res.success) {
        showSuccess(`request ${status.toLowerCase()} successfully`);
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

  const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
  const daysCount = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  const TABS = [
    { id: 'calendar', label: 'team calendar', icon: Calendar },
    { id: 'remote', label: 'remote clock-in', icon: MapPin },
    { id: 'biometric', label: 'hardware', icon: Fingerprint },
    { id: 'networks', label: 'ip networks', icon: Wifi },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <Check size={16} />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-500 text-white px-5 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <X size={16} />
          <span className="text-xs font-semibold">{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">attendance</h1>
            <p className="text-slate-500 text-sm mt-1">
              biometric hardware, ip whitelists, remote clock-ins, and the team check-in calendar.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="px-5 py-3 bg-white hover:border-indigo-300 hover:text-indigo-700 border border-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all"
            >
              request regularization
            </button>
            <button
              onClick={handleProcessLogs}
              disabled={loading}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={14} /> : <Activity size={14} />}
              process biometric logs
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                  isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab body */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          {/* Tab 1: Calendar */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">team check-in calendar</h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    monthly grid of attendance entries per employee.
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none lowercase"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2026, i).toLocaleString('default', { month: 'long' }).toLowerCase()}
                      </option>
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

              <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-5 text-[10px] font-semibold text-slate-500 w-56 sticky left-0 bg-slate-50 border-r border-slate-200">
                        employee
                      </th>
                      {daysArray.map((day) => (
                        <th
                          key={day}
                          className="py-3 px-1 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-100 last:border-0 min-w-[36px]"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calendarData.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 font-semibold text-xs text-slate-800 sticky left-0 bg-white border-r border-slate-200">
                          <div>
                            <p>{emp.name}</p>
                            <p className="text-[9px] font-medium text-slate-400 lowercase">
                              {emp.employeeId} · {emp.department}
                            </p>
                          </div>
                        </td>
                        {daysArray.map((day) => {
                          const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = emp.records?.find((r) => r.date === dayStr);
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
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-extrabold mx-auto cursor-default transition-all hover:scale-110 ${pillClass}`}
                                title={
                                  record
                                    ? `${record.status} (in: ${
                                        record.check_in ? new Date(record.check_in).toLocaleTimeString() : '—'
                                      }, out: ${record.check_out ? new Date(record.check_out).toLocaleTimeString() : '—'})`
                                    : 'no entry'
                                }
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
                        <td colSpan={daysCount + 1} className="py-12 text-center text-xs font-semibold text-slate-400">
                          no calendar data for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500">status legend:</span>
                {[
                  { sym: 'P', label: 'present', cls: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
                  { sym: 'L', label: 'late', cls: 'bg-amber-50 border-amber-200 text-amber-600' },
                  { sym: 'A', label: 'absent', cls: 'bg-rose-50 border-rose-200 text-rose-600' },
                  { sym: 'H', label: 'half day', cls: 'bg-purple-50 border-purple-200 text-purple-600' },
                ].map((s) => (
                  <div key={s.sym} className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center text-[9px] font-semibold ${s.cls}`}>
                      {s.sym}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-slate-500">regularization requests</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {regularizations.map((reg) => (
                    <div key={reg.id} className="p-5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 lowercase">
                          {reg.name} ({reg.type})
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 lowercase">
                          requested date: {reg.date} at {reg.time} · reason: {reg.reason}
                        </p>
                        {reg.approverRemarks && (
                          <p className="text-[9px] text-slate-400 mt-0.5">approver: {reg.approverRemarks}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {reg.status === 'PENDING' ? (
                          user?.role === 'SUPER_ADMIN' || user?.role === 'HR' || user?.role === 'ADMIN' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleProcessReg(reg.id, 'APPROVED')}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-semibold rounded-lg hover:bg-emerald-600 transition-all"
                              >
                                approve
                              </button>
                              <button
                                onClick={() => handleProcessReg(reg.id, 'REJECTED')}
                                className="px-3 py-1.5 bg-rose-500 text-white text-[9px] font-semibold rounded-lg hover:bg-rose-600 transition-all"
                              >
                                reject
                              </button>
                            </div>
                          ) : (
                            <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-lg text-[9px] font-semibold">
                              pending
                            </span>
                          )
                        ) : reg.status === 'APPROVED' ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-lg text-[9px] font-semibold">
                            approved
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-lg text-[9px] font-semibold">
                            rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {regularizations.length === 0 && (
                    <p className="p-8 text-center text-xs text-slate-400 font-semibold">no regularization requests.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Remote clock-in */}
          {activeTab === 'remote' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">remote check-in</h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    log check-in / check-out from anywhere — validated against the ip whitelist.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center justify-center text-indigo-600">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">current session</p>
                      <h4 className="text-xs font-semibold text-slate-800">
                        {user?.name} · <span className="lowercase">{user?.role}</span>
                      </h4>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 w-full" />

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block">last action</span>
                      {remoteStatus ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-lg text-[9px] inline-block mt-1">
                          active check-in
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] inline-block mt-1">
                          no active shift
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ip / coordinates</span>
                      <span className="font-mono text-[10px] block mt-1 text-slate-500">192.168.1.105 (41.8781° N)</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleRemoteClockIn(false)}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all disabled:opacity-50"
                  >
                    check in
                  </button>
                  <button
                    onClick={() => handleRemoteClockIn(true)}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-2xl transition-all disabled:opacity-50"
                  >
                    check out
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-slate-500">recent attendance events</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {events.map((ev, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800">{ev.employeeName || 'staff member'}</p>
                        <p className="text-[10px] text-slate-400 lowercase">
                          date: {ev.date} · device: {ev.device_id || 'system'}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border ${
                          ev.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : ev.status === 'LATE'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <p className="p-8 text-center text-xs text-slate-400 font-semibold">no attendance events yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Biometric hardware */}
          {activeTab === 'biometric' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">biometric hardware</h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    whitelisted fingerprint, card, or face-recognition terminals.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {devices.map((d) => (
                    <div key={d.id} className="p-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                      <div className="flex gap-4 items-center">
                        <div className="w-11 h-11 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center justify-center text-indigo-600">
                          <Fingerprint size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs lowercase">{d.deviceName}</p>
                          <p className="text-[10px] font-mono font-semibold text-slate-400">
                            {d.deviceIp} · online
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDevice(d.id)}
                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-2 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {devices.length === 0 && (
                    <div className="p-12 text-center text-slate-400 text-xs font-semibold">no hardware registered.</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-5 h-fit">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">register hardware</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">whitelist a new terminal by ip.</p>
                </div>
                <form onSubmit={handleAddDevice} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">device name</label>
                    <input
                      type="text"
                      placeholder="e.g. lobby terminal"
                      value={newDevice.device_name}
                      onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 transition-all text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">device ip</label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.150"
                      value={newDevice.deviceIp}
                      onChange={(e) => setNewDevice({ ...newDevice, deviceIp: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 transition-all text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    whitelist device
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 4: IP networks */}
          {activeTab === 'networks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">whitelisted ip networks</h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    wi-fi ip ranges or vpn subnets allowed for remote check-ins.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {networksList.map((n) => (
                    <div
                      key={n.id}
                      className="p-5 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-11 h-11 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center justify-center text-indigo-600">
                          <Wifi size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs lowercase">{n.label}</p>
                          <p className="text-[10px] font-mono font-semibold text-slate-400">
                            {n.ip_address_or_range} · {n.is_active ? 'active' : 'inactive'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNetwork(n.id)}
                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-2 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {networksList.length === 0 && (
                    <div className="p-12 text-center text-slate-400 text-xs font-semibold">no whitelisted ip ranges.</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-5 h-fit">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">whitelist network</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">add an office wi-fi range or vpn subnet.</p>
                </div>
                <form onSubmit={handleAddNetwork} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">network label</label>
                    <input
                      type="text"
                      placeholder="e.g. office wi-fi"
                      value={newNetwork.label}
                      onChange={(e) => setNewNetwork({ ...newNetwork, label: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 transition-all text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">ip subnet</label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.0/24"
                      value={newNetwork.ip_address_or_range}
                      onChange={(e) => setNewNetwork({ ...newNetwork, ip_address_or_range: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 transition-all text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    whitelist range
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regularization modal */}
      {isRegModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute right-6 top-6 text-slate-500 hover:text-slate-700 transition-colors p-1"
            >
              <X size={18} />
            </button>
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-slate-800">request regularization</h3>
              <p className="text-[10px] text-slate-500 font-semibold">request an adjustment to a missed clock-in or clock-out.</p>
            </div>
            <form onSubmit={handleRequestRegularization} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">target date</label>
                <input
                  type="date"
                  value={regForm.date}
                  onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 text-slate-800 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">slot</label>
                <select
                  value={regForm.type}
                  onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 text-slate-800 transition-all"
                >
                  <option value="check-in">check-in</option>
                  <option value="check-out">check-out</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">time (hh:mm)</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00"
                  value={regForm.time}
                  onChange={(e) => setRegForm({ ...regForm, time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 text-slate-800 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">reason</label>
                <textarea
                  placeholder="e.g. scanner was unresponsive"
                  value={regForm.reason}
                  onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600 text-slate-800 h-20 resize-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 text-white font-semibold text-xs rounded-2xl shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                submit request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
