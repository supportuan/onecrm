'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Fingerprint,
  Check,
  X,
  RefreshCw,
  CalendarDays,
  FileText,
  Settings,
  Activity,
  Trash2,
  Wifi,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import {
  getMyAttendance,
  submitRemoteClockIn,
  getRegularizations,
  requestRegularization,
  processRegularization,
  getDevices,
  createDevice,
  deleteDevice,
  getNetworks,
  createNetwork,
  deleteNetwork,
  processBiometricLogs,
} from '@/services/hrApi';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const workedHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
};

const statusStyle = (status) => {
  switch (status) {
    case 'PRESENT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'LATE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ABSENT':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'HALF_DAY':
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    default:
      return 'bg-neutral-50 text-neutral-600 border-neutral-200';
  }
};

export default function Attendance() {
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const canManage = can(['MANAGE_ATTENDANCE', 'MANAGE_BIOMETRICS']);

  const today = new Date();
  const [activeTab, setActiveTab] = useState('clock');
  const [now, setNow] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockBusy, setClockBusy] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const [regularizations, setRegularizations] = useState([]);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({ date: '', type: 'check-in', time: '', reason: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);

  const [devices, setDevices] = useState([]);
  const [networksList, setNetworksList] = useState([]);
  const [newDevice, setNewDevice] = useState({ device_name: '', deviceIp: '' });
  const [newNetwork, setNewNetwork] = useState({ label: '', ip_address_or_range: '' });
  const [adminBusy, setAdminBusy] = useState(false);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3500);
  };

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAttendance(selectedMonth, selectedYear);
      if (res.success) setData(res.data);
    } catch (_) {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadRegularizations = useCallback(async () => {
    try {
      const res = await getRegularizations();
      if (res.success) setRegularizations(res.data || []);
    } catch (_) {
      setRegularizations([]);
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (!canManage) return;
    try {
      const [devRes, netRes] = await Promise.all([getDevices(), getNetworks()]);
      if (devRes.success) setDevices(devRes.data || []);
      if (netRes.success) setNetworksList(netRes.data || []);
    } catch (_) {
      /* ignore */
    }
  }, [canManage]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (activeTab === 'requests') loadRegularizations();
    if (activeTab === 'admin') loadAdmin();
  }, [activeTab, loadRegularizations, loadAdmin]);

  const clockState = data?.clockState || 'not_clocked_in';
  const todayRecord = data?.today;

  const handleClock = async (isCheckOut) => {
    setClockBusy(true);
    try {
      const res = await submitRemoteClockIn({
        employeeId: user?.email,
        isCheckOut,
      });
      if (res?.success) {
        showToast('ok', isCheckOut ? 'Clocked out successfully' : 'Clocked in successfully');
        await loadAttendance();
      } else {
        showToast('err', res?.message || res?.error || 'Clock action failed');
      }
    } catch (err) {
      showToast('err', err?.message || 'Clock action failed');
    } finally {
      setClockBusy(false);
    }
  };

  const handleRequestRegularization = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    try {
      const res = await requestRegularization({
        employeeId: user?.email,
        ...regForm,
      });
      if (res.success) {
        setRegForm({ date: '', type: 'check-in', time: '', reason: '' });
        setIsRegModalOpen(false);
        showToast('ok', 'Regularization request submitted');
        loadRegularizations();
      }
    } catch (err) {
      showToast('err', err?.message || 'Request failed');
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleProcessReg = async (id, status) => {
    try {
      const res = await processRegularization(id, status, 'Reviewed by manager');
      if (res.success) {
        showToast('ok', `Request ${status.toLowerCase()}`);
        loadRegularizations();
      }
    } catch (err) {
      showToast('err', err?.message || 'Action failed');
    }
  };

  const TABS = [
    { id: 'clock', label: 'Clock in / out', icon: Fingerprint },
    { id: 'history', label: 'My history', icon: CalendarDays },
    { id: 'requests', label: 'Regularizations', icon: FileText },
    ...(canManage ? [{ id: 'admin', label: 'Admin setup', icon: Settings }] : []),
  ];

  const summary = data?.summary || { present: 0, late: 0, absent: 0, halfDay: 0, totalDays: 0 };

  return (
    <div className="ui-page text-neutral-800 font-sans">
      {toast.msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 text-white ${
            toast.type === 'ok' ? 'bg-neutral-900' : 'bg-red-600'
          }`}
        >
          {toast.type === 'ok' ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="ui-container">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Attendance</h1>
          <p className="text-sm text-neutral-500 mt-1">Clock in and out, track your hours, and request corrections.</p>
        </div>

        <div className="flex flex-wrap gap-1 bg-white border border-neutral-200 rounded-lg p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'clock' && (
          <div className="space-y-6">
            <div className="ui-card text-center">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-5xl md:text-6xl font-light text-neutral-900 mt-3 tabular-nums tracking-tight">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>

              <div className="mt-6">
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-md border ${
                    clockState === 'clocked_in'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : clockState === 'clocked_out'
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-600'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {clockState === 'clocked_in'
                    ? 'On the clock'
                    : clockState === 'clocked_out'
                      ? 'Shift complete'
                      : 'Not clocked in'}
                </span>
              </div>

              {!data?.employee && !loading && (
                <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 w-auto inline-block">
                  Your login is not linked to an employee record. Contact HR to enable attendance.
                </p>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center w-auto">
                <button
                  type="button"
                  onClick={() => handleClock(false)}
                  disabled={clockBusy || clockState === 'clocked_in' || !data?.employee}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {clockBusy ? <RefreshCw className="animate-spin" size={16} /> : <LogIn size={16} />}
                  Clock in
                </button>
                <button
                  type="button"
                  onClick={() => handleClock(true)}
                  disabled={clockBusy || clockState !== 'clocked_in' || !data?.employee}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg border border-neutral-200 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {clockBusy ? <RefreshCw className="animate-spin" size={16} /> : <LogOut size={16} />}
                  Clock out
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="ui-panel p-5">
                <p className="text-xs text-neutral-500 font-medium">Clock in</p>
                <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
                  {formatTime(todayRecord?.checkIn)}
                </p>
              </div>
              <div className="ui-panel p-5">
                <p className="text-xs text-neutral-500 font-medium">Clock out</p>
                <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
                  {formatTime(todayRecord?.checkOut)}
                </p>
              </div>
              <div className="ui-panel p-5">
                <p className="text-xs text-neutral-500 font-medium">Hours today</p>
                <p className="text-xl font-semibold text-neutral-900 mt-1 tabular-nums">
                  {workedHours(todayRecord?.checkIn, todayRecord?.checkOut) || '—'}
                </p>
              </div>
            </div>

            <div className="ui-panel p-5">
              <p className="text-xs font-medium text-neutral-500 mb-3">This month</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Present', value: summary.present },
                  { label: 'Late', value: summary.late },
                  { label: 'Absent', value: summary.absent },
                  { label: 'Half day', value: summary.halfDay },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-neutral-900">{s.value}</span>
                    <span className="text-neutral-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="ui-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-900">My attendance history</h2>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 outline-none"
                >
                  {MONTHS.map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 outline-none"
                >
                  {[today.getFullYear(), today.getFullYear() - 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex justify-center">
                <RefreshCw className="animate-spin text-neutral-400" size={24} />
              </div>
            ) : (data?.records?.length ?? 0) === 0 ? (
              <p className="p-12 text-center text-sm text-neutral-500">No attendance records for this period.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.records.map((row) => (
                  <div key={row.id || row.date} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-neutral-50/50">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{formatDate(row.date)}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                        <Clock size={12} />
                        In {formatTime(row.check_in)} · Out {formatTime(row.check_out)}
                        {workedHours(row.check_in, row.check_out) && (
                          <span className="text-neutral-400"> · {workedHours(row.check_in, row.check_out)}</span>
                        )}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase border ${statusStyle(row.status)}`}>
                      {row.status?.replace('_', ' ') || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsRegModalOpen(true)}
                className="px-4 py-2 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                Request regularization
              </button>
            </div>
            <div className="ui-panel divide-y divide-neutral-100">
              {regularizations.length === 0 ? (
                <p className="p-10 text-center text-sm text-neutral-500">No regularization requests.</p>
              ) : (
                regularizations.map((reg) => (
                  <div key={reg.id} className="px-5 py-4 flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{reg.name || user?.fullName}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {reg.date} · {reg.type} at {reg.time}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">{reg.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {reg.status === 'PENDING' && canManage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleProcessReg(reg.id, 'APPROVED')}
                            className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessReg(reg.id, 'REJECTED')}
                            className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded-lg"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase rounded-md border ${
                          reg.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : reg.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {reg.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && canManage && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                type="button"
                disabled={adminBusy}
                onClick={async () => {
                  setAdminBusy(true);
                  try {
                    await processBiometricLogs();
                    showToast('ok', 'Biometric logs processed');
                    loadAdmin();
                  } catch (err) {
                    showToast('err', err?.message || 'Failed');
                  } finally {
                    setAdminBusy(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-neutral-900 text-white rounded-lg disabled:opacity-50"
              >
                <Activity size={14} />
                Process biometric logs
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="ui-panel p-5 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900">Biometric devices</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {devices.map((d) => (
                    <div key={d.id} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-neutral-800">{d.deviceName}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">{d.deviceIp}</p>
                      </div>
                      <button type="button" onClick={() => deleteDevice(d.id).then(loadAdmin)} className="text-neutral-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {devices.length === 0 && <p className="text-xs text-neutral-500">No devices registered.</p>}
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await createDevice({
                      device_id: newDevice.deviceIp,
                      device_name: newDevice.device_name,
                      device_ip: newDevice.deviceIp,
                      deviceIp: newDevice.deviceIp,
                    });
                    setNewDevice({ device_name: '', deviceIp: '' });
                    loadAdmin();
                  }}
                  className="space-y-2 pt-2 border-t border-neutral-100"
                >
                  <input
                    placeholder="Device name"
                    value={newDevice.device_name}
                    onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                    className="ui-input text-xs"
                    required
                  />
                  <input
                    placeholder="Device IP"
                    value={newDevice.deviceIp}
                    onChange={(e) => setNewDevice({ ...newDevice, deviceIp: e.target.value })}
                    className="ui-input text-xs"
                    required
                  />
                  <button type="submit" className="ui-btn-primary w-full text-xs">Add device</button>
                </form>
              </div>

              <div className="ui-panel p-5 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  <Wifi size={14} /> IP networks
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {networksList.map((n) => (
                    <div key={n.id} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-neutral-800">{n.label}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">{n.ip_address_or_range}</p>
                      </div>
                      <button type="button" onClick={() => deleteNetwork(n.id).then(loadAdmin)} className="text-neutral-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {networksList.length === 0 && <p className="text-xs text-neutral-500">No networks whitelisted.</p>}
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await createNetwork(newNetwork);
                    setNewNetwork({ label: '', ip_address_or_range: '' });
                    loadAdmin();
                  }}
                  className="space-y-2 pt-2 border-t border-neutral-100"
                >
                  <input
                    placeholder="Label"
                    value={newNetwork.label}
                    onChange={(e) => setNewNetwork({ ...newNetwork, label: e.target.value })}
                    className="ui-input text-xs"
                    required
                  />
                  <input
                    placeholder="IP range e.g. 192.168.1.0/24"
                    value={newNetwork.ip_address_or_range}
                    onChange={(e) => setNewNetwork({ ...newNetwork, ip_address_or_range: e.target.value })}
                    className="ui-input text-xs"
                    required
                  />
                  <button type="submit" className="ui-btn-primary w-full text-xs">Add network</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {isRegModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-neutral-200 w-auto rounded-lg shadow-lg p-6 relative">
            <button
              type="button"
              onClick={() => setIsRegModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Request regularization</h3>
            <p className="text-xs text-neutral-500 mb-4">Correct a missed clock-in or clock-out.</p>
            <form onSubmit={handleRequestRegularization} className="space-y-3">
              <input
                type="date"
                value={regForm.date}
                onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                className="ui-input text-sm"
                required
              />
              <select
                value={regForm.type}
                onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}
                className="ui-input text-sm"
              >
                <option value="check-in">Clock in</option>
                <option value="check-out">Clock out</option>
              </select>
              <input
                type="time"
                value={regForm.time}
                onChange={(e) => setRegForm({ ...regForm, time: e.target.value })}
                className="ui-input text-sm"
                required
              />
              <textarea
                placeholder="Reason"
                value={regForm.reason}
                onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                className="ui-input text-sm h-20 resize-none"
                required
              />
              <button type="submit" disabled={regSubmitting} className="ui-btn-primary w-full">
                Submit request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
