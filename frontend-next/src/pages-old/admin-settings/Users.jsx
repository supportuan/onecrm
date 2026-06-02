
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

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "COUNSELLOR",
  "HR",
  "STUDENT",
  "AGENT",
];

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
  const [users, setUsers] = useState(sampleUsers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    const allowedModules = roleModuleAccess[form.role] || [];

    setForm((prev) => ({
      ...prev,
      modules: allowedModules,
      permissions: getPermissionsForModules(allowedModules),
    }));
  }, [form.role]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

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

  const handleCreateUser = () => {
    if (!form.firstName || !form.email || !form.role) {
      alert("Please fill required fields");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      phone: form.phone,
      role: form.role,
      status: form.isActive ? "Active" : "Inactive",
      modules: form.modules,
      permissions: form.permissions,
    };

    setUsers((prev) => [...prev, newUser]);
    setShowCreateModal(false);
    resetForm();

    alert(
      "User created successfully. Random password will be sent to the user's email."
    );
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
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Modules</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {user.name}
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {user.email}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {user.role === "SUPER_ADMIN"
                      ? "All Modules"
                      : user.modules?.join(", ")}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        user.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                        <Edit className="h-4 w-4" />
                      </button>

                      <button className="rounded-xl p-2 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                    {roles.map((role) => (
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