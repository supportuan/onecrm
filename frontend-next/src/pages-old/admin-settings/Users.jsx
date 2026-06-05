
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  ShieldCheck,
} from "lucide-react";
import { getUsers, createUser, deleteUser, updateUser, getCounsellors } from "../../services/userApi";
import { useAuth } from "../../lib/auth/AuthContext";

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "COUNSELLOR",
  "HR",
  "STUDENT",
  "AGENT",
];

const creatableRoles = ["ADMIN", "COUNSELLOR", "HR", "STUDENT"];

const modules = [
  "Marketing",
  "Student",
  "Agent Portal",
  "HRM",
  "Counsellor",
];

const roleModuleAccess = {
  SUPER_ADMIN: modules,
  ADMIN: ["Marketing", "Student", "Agent Portal", "Counsellor"],
  COUNSELLOR: ["Marketing", "Student"],
  HR: ["HRM"],
  STUDENT: ["Student"],
  AGENT: ["Agent Portal"],
};

const permissionsByModule = {
  Marketing: ["View Marketing", "Create Leads", "Edit Leads"],
  Student: ["View Student", "Create Student", "Edit Student"],
  "Agent Portal": ["View Agent Portal", "Manage Own Leads", "View Commission"],
  HRM: ["View HRM", "Manage Attendance", "Manage Leave", "Manage Payroll"],
  Counsellor: ["View Counsellor", "Create Counsellor", "Edit Counsellor"],
};

const sampleUsers = [
  {
    id: 1,
    name: "Super Admin",
    email: "superadmin@portal.com",
    role: "SUPER_ADMIN",
    status: "Active",
    modules: modules,
  },
];

const getPermissionsForModules = (selectedModules) => {
  return selectedModules.flatMap(
    (moduleName) => permissionsByModule[moduleName] || []
  );
};

export default function UserManagementPage() {
  const { accessToken, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "pending-agents", "pending-students"
  const [counsellors, setCounsellors] = useState([]);
  const [selectedCounsellors, setSelectedCounsellors] = useState({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "ADMIN",
    isActive: true,
    modules: roleModuleAccess.ADMIN,
    permissions: getPermissionsForModules(roleModuleAccess.ADMIN),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, counsellorsRes] = await Promise.all([
        getUsers(),
        getCounsellors()
      ]);
      if (usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (counsellorsRes.success) {
        setCounsellors(counsellorsRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !accessToken) return;
    loadData();
  }, [authLoading, accessToken]);

  useEffect(() => {
    const allowedModules = roleModuleAccess[form.role] || [];

    setForm((prev) => ({
      ...prev,
      modules: allowedModules,
      permissions: getPermissionsForModules(allowedModules),
    }));
  }, [form.role]);

  const pendingAgents = useMemo(() => {
    return users.filter((u) => u.role === "AGENT" && !u.isApproved);
  }, [users]);

  const pendingStudents = useMemo(() => {
    return users.filter((u) => u.role === "STUDENT" && !u.counsellorId);
  }, [users]);

  const pendingAgentsCount = pendingAgents.length;
  const pendingStudentsCount = pendingStudents.length;

  const filteredUsers = useMemo(() => {
    let list = users;
    if (activeTab === "pending-agents") {
      list = pendingAgents;
    } else if (activeTab === "pending-students") {
      list = pendingStudents;
    } else {
      // In the "all" tab, do we show approved users or everyone?
      // Typically everyone, but we could highlight if they are approved or active
    }

    return list.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search, activeTab, pendingAgents, pendingStudents]);

  const handleApproveAgent = async (id) => {
    try {
      const res = await updateUser(id, { isApproved: true });
      if (res.success) {
        loadData();
        alert("Agent approved successfully.");
      } else {
        alert(res.message || "Failed to approve agent");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while approving agent");
    }
  };

  const handleRejectAgent = async (id) => {
    if (!window.confirm("Reject and deactivate this agent?")) return;
    try {
      const res = await deleteUser(id);
      if (res.success) {
        loadData();
        alert("Agent rejected and account deactivated.");
      } else {
        alert(res.message || "Failed to reject agent");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while rejecting agent");
    }
  };

  const handleAssignCounsellor = async (studentId) => {
    const counsellorId = selectedCounsellors[studentId];
    if (!counsellorId) {
      alert("Please select a counsellor");
      return;
    }
    try {
      const res = await updateUser(studentId, { counsellorId: Number(counsellorId) });
      if (res.success) {
        loadData();
        alert("Counsellor assigned successfully.");
      } else {
        alert(res.message || "Failed to assign counsellor");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while assigning counsellor");
    }
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "ADMIN",
      isActive: true,
      modules: roleModuleAccess.ADMIN,
      permissions: getPermissionsForModules(roleModuleAccess.ADMIN),
    });
  };

  const handleCreateUser = async () => {
    if (!form.firstName || !form.email || !form.role) {
      alert("Please fill required fields");
      return;
    }

    try {
      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        // Password length must be >= 8 to pass schema validation
        password: Math.random().toString(36).slice(-10) + "A1!",
      };

      const res = await createUser(payload);
      if (res.success) {
        setShowCreateModal(false);
        resetForm();
        loadData();
        alert(
          "User created successfully. Credentials have been dispatched to their email."
        );
      } else {
        alert(res.message || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while creating user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this user?")) return;

    try {
      const res = await deleteUser(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Failed to deactivate user");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while deactivating user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Admin & Settings
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create users. Username will be email and random password will be
            sent automatically.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 mb-5">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab("pending-agents")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "pending-agents"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Agents
            {pendingAgentsCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {pendingAgentsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pending-students")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "pending-students"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Students
            {pendingStudentsCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {pendingStudentsCount}
              </span>
            )}
          </button>
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 md:max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-sm font-semibold text-slate-500">Retrieving system users...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                {activeTab === "pending-agents" ? (
                  <tr>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Agency Details</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                ) : activeTab === "pending-students" ? (
                  <tr>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Assign Counsellor</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Modules</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {user.fullName}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {user.email}
                    </td>

                    {activeTab === "pending-agents" ? (
                      <>
                        <td className="px-5 py-4">
                          {user.agencyDetails ? (
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-700 text-xs">
                                {user.agencyDetails.agencyName}
                              </p>
                              <p className="text-[11px] text-slate-500 leading-tight">
                                Code: {user.agencyDetails.agencyCode || 'N/A'} <br />
                                {user.agencyDetails.agencyAddress && `${user.agencyDetails.agencyAddress}, `}
                                {user.agencyDetails.agencyCity} {user.agencyDetails.agencyCountry}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No agency details</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                            Awaiting Approval
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveAgent(user.id)}
                              className="rounded-xl bg-emerald-650 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectAgent(user.id)}
                              className="rounded-xl bg-red-50 hover:bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-650 transition border border-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </>
                    ) : activeTab === "pending-students" ? (
                      <>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={selectedCounsellors[user.id] || ""}
                            onChange={(e) =>
                              setSelectedCounsellors((prev) => ({
                                ...prev,
                                [user.id]: e.target.value,
                              }))
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 w-full max-w-[200px]"
                          >
                            <option value="">Select Counsellor...</option>
                            {counsellors.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.fullName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleAssignCounsellor(user.id)}
                              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
                            >
                              Assign
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                            {user.role}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {user.role === "SUPER_ADMIN"
                            ? "All Modules"
                            : (roleModuleAccess[user.role] || []).join(", ")}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              !user.isActive
                                ? "bg-red-50 text-red-700"
                                : user.role === "AGENT" && !user.isApproved
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {!user.isActive
                              ? "Inactive"
                              : user.role === "AGENT" && !user.isApproved
                              ? "Pending Approval"
                              : "Active"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(user.id)}
                              className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={activeTab === "pending-agents" ? 5 : activeTab === "pending-students" ? 5 : 6}
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create User
                </h2>
                <p className="text-sm text-slate-500">
                  Username will be email. Random password will be sent to the
                  user email automatically.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <UserPlus className="h-4 w-4 text-indigo-600" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    placeholder="First Name *"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />

                  <input
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />

                  <input
                    placeholder="Email Address *"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />

                  <input
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Role & Status
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    {creatableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    Active User
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="mb-4 text-sm font-bold text-slate-800">
                  Module Access
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {modules.map((moduleName) => {
                    const allowed = form.modules.includes(moduleName);

                    return (
                      <label
                        key={moduleName}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                          allowed
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={allowed}
                          readOnly
                          disabled
                          className="h-4 w-4"
                        />
                        {moduleName}
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="mb-4 text-sm font-bold text-slate-800">
                  Permissions
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {form.modules.map((moduleName) => (
                    <div
                      key={moduleName}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <h4 className="mb-3 text-sm font-bold text-slate-700">
                        {moduleName}
                      </h4>

                      <div className="space-y-2">
                        {(permissionsByModule[moduleName] || []).map(
                          (permission) => (
                            <label
                              key={permission}
                              className="flex items-center gap-3 text-sm text-slate-600"
                            >
                              <input
                                type="checkbox"
                                checked={form.permissions.includes(permission)}
                                readOnly
                                disabled
                                className="h-4 w-4"
                              />
                              {permission}
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateUser}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}