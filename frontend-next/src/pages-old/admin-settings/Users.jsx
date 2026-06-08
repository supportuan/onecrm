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
  ChevronDown,
} from "lucide-react";
import {
  getUsers,
  createUser,
  deleteUser,
  updateUser,
  getCounsellors,
} from "../../services/userApi";

const creatableRoles = ["ADMIN", "COUNSELLOR", "HR", "STUDENT", "AGENT"];
const ACTIONS = ["VIEW", "EDIT"];

const MODULE_ACCESS_OPTIONS = [
  {
    module: "Marketing",
    options: [
      "Lead Management",
      "Campaigns",
      "Automation",
      "Landing Pages & Forms",
      "Marketing Analytics",
    ],
  },
  {
    module: "Student CRM",
    options: [
      "Student Management",
      "Applications",
      "Visa Management",
      "Counselling",
    ],
  },
  {
    module: "Agency CRM",
    options: [
      "Agency Management",
      "Agency Leads",
      "Co-branding Tools",
      "Commission Management",
    ],
  },
  {
    module: "HR",
    options: [
      "Employee Directory",
      "Attendance",
      "Leave Management",
      "Payroll Inputs",
      "Performance Reviews",
      "Recruitment Tracker",
    ],
  },
  {
    module: "Admin & Settings",
    options: ["User Management", "Roles", "Permissions", "Settings"],
  },
];

const createEmptyModuleAccess = () => {
  const access = {};
  MODULE_ACCESS_OPTIONS.forEach((item) => {
    access[item.module] = {};
    item.options.forEach((option) => {
      access[item.module][option] = [];
    });
  });
  return access;
};

const setOptionActions = (access, moduleName, optionName, actions) => ({
  ...access,
  [moduleName]: {
    ...(access[moduleName] || {}),
    [optionName]: actions,
  },
});


const getDefaultModuleAccessByRole = (role) => {
  let access = createEmptyModuleAccess();

  const giveModuleActions = (moduleName, actions = ["VIEW", "EDIT"]) => {
    const moduleData = MODULE_ACCESS_OPTIONS.find(
      (item) => item.module === moduleName
    );

    moduleData?.options.forEach((optionName) => {
      access = setOptionActions(access, moduleName, optionName, actions);
    });
  };

  if (role === "HR") {
    giveModuleActions("HR", ["VIEW", "EDIT"]);
  }

  if (role === "STUDENT") {
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
  }

  if (role === "AGENT") {
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
  }

  if (role === "COUNSELLOR") {
    giveModuleActions("Marketing", ["VIEW"]);
    giveModuleActions("Student CRM", ["VIEW"]);
  }

  if (role === "ADMIN") {
    giveModuleActions("Marketing", ["VIEW", "EDIT"]);
    giveModuleActions("Student CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Agency CRM", ["VIEW", "EDIT"]);
    giveModuleActions("Admin & Settings", ["VIEW", "EDIT"]);
  }

  return access;
};

const normalizeModuleAccess = (access) => {
  const empty = createEmptyModuleAccess();
  if (!access) return empty;

  Object.entries(access).forEach(([moduleName, options]) => {
    if (!empty[moduleName]) return;

    if (Array.isArray(options)) {
      options.forEach((optionName) => {
        if (empty[moduleName][optionName]) {
          empty[moduleName][optionName] = ["VIEW"];
        }
      });
    } else {
      Object.entries(options || {}).forEach(([optionName, actions]) => {
        if (empty[moduleName][optionName]) {
          empty[moduleName][optionName] = Array.isArray(actions) ? actions : [];
        }
      });
    }
  });

  return empty;
};

const getCleanModuleAccess = (access) => {
  const clean = {};

  Object.entries(access || {}).forEach(([moduleName, options]) => {
    Object.entries(options || {}).forEach(([optionName, actions]) => {
      if (Array.isArray(actions) && actions.length > 0) {
        if (!clean[moduleName]) clean[moduleName] = {};
        clean[moduleName][optionName] = actions;
      }
    });
  });

  return clean;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [counsellors, setCounsellors] = useState([]);
  const [selectedCounsellors, setSelectedCounsellors] = useState({});
  const [selectedModule, setSelectedModule] = useState("Marketing");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "ADMIN",
    isActive: true,
    moduleAccess: getDefaultModuleAccessByRole("ADMIN"),
  });

  const selectedModuleData = MODULE_ACCESS_OPTIONS.find(
    (item) => item.module === selectedModule
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, counsellorsRes] = await Promise.all([
        getUsers(),
        getCounsellors(),
      ]);

      if (usersRes.success) setUsers(usersRes.data || []);
      if (counsellorsRes.success) setCounsellors(counsellorsRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingAgents = useMemo(() => {
    return users.filter((u) => u.role === "AGENT" && !u.isApproved);
  }, [users]);

  const pendingStudents = useMemo(() => {
    return users.filter((u) => u.role === "STUDENT" && !u.counsellorId);
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = users;

    if (activeTab === "pending-agents") list = pendingAgents;
    if (activeTab === "pending-students") list = pendingStudents;

    return list.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.role || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search, activeTab, pendingAgents, pendingStudents]);

  const resetForm = () => {
    setSelectedModule("Marketing");
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "ADMIN",
      isActive: true,
      moduleAccess: getDefaultModuleAccessByRole("ADMIN"),
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setModalMode("create");
    setEditingUser(null);
    resetForm();
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingUser(null);
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditUser = (user) => {
    setModalMode("edit");
    setEditingUser(user);
    setSelectedModule("Marketing");

    setForm({
      firstName: user.fullName?.split(" ")[0] || "",
      lastName: user.fullName?.split(" ").slice(1).join(" ") || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "ADMIN",
      isActive: user.isActive ?? true,
      moduleAccess: normalizeModuleAccess(user.moduleAccess),
    });

    setShowCreateModal(true);
  };

  const handleRoleChange = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      moduleAccess: getDefaultModuleAccessByRole(role),
    }));

    setSelectedModule("Marketing");
  };

  const toggleOptionAction = (moduleName, optionName, action) => {
    setForm((prev) => {
      const currentAccess = normalizeModuleAccess(prev.moduleAccess);
      const currentActions = currentAccess[moduleName]?.[optionName] || [];
      const alreadySelected = currentActions.includes(action);

      const updatedActions = alreadySelected
        ? currentActions.filter((item) => item !== action)
        : [...currentActions, action];

      return {
        ...prev,
        moduleAccess: setOptionActions(
          currentAccess,
          moduleName,
          optionName,
          updatedActions
        ),
      };
    });
  };

  const toggleFullModule = (moduleName, options) => {
    setForm((prev) => {
      const currentAccess = normalizeModuleAccess(prev.moduleAccess);

      const allSelected = options.every((option) => {
        const actions = currentAccess[moduleName]?.[option] || [];
        return ACTIONS.every((action) => actions.includes(action));
      });

      const updatedModule = {};

      options.forEach((option) => {
        updatedModule[option] = allSelected ? [] : [...ACTIONS];
      });

      return {
        ...prev,
        moduleAccess: {
          ...currentAccess,
          [moduleName]: updatedModule,
        },
      };
    });
  };

  const handleSaveUser = async () => {
    if (modalMode === "create") {
      if (!form.firstName || !form.email || !form.role) {
        alert("Please fill required fields");
        return;
      }
    }

    try {
      let res;

      if (modalMode === "edit") {
        res = await updateUser(editingUser.id, {
          role: form.role,
          moduleAccess: getCleanModuleAccess(form.moduleAccess),
        });
      } else {
        const payload = {
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          isActive: form.isActive,
          moduleAccess: getCleanModuleAccess(form.moduleAccess),
        };

        res = await createUser(payload);
      }

      if (res.success) {
        closeModal();
        loadData();

        alert(
          modalMode === "edit"
            ? "User role and access updated successfully."
            : "User created successfully. Credentials have been sent by email."
        );
      } else {
        alert(res.message || "Failed to save user");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while saving user");
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
      const res = await updateUser(studentId, {
        counsellorId: Number(counsellorId),
      });

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

  const renderModuleAccessSummary = (access) => {
    const cleanAccess = getCleanModuleAccess(normalizeModuleAccess(access));

    if (Object.keys(cleanAccess).length === 0) {
      return <span className="text-slate-400">No module access</span>;
    }

    return Object.entries(cleanAccess)
      .map(([moduleName, options]) => {
        const optionText = Object.entries(options)
          .map(([optionName, actions]) => `${optionName} (${actions.join("/")})`)
          .join(", ");

        return `${moduleName}: ${optionText}`;
      })
      .join(" | ");
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
            Create users and assign Module → Option → VIEW / EDIT access.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex overflow-x-auto border-b border-slate-100">
          <button
            onClick={() => setActiveTab("all")}
            className={`border-b-2 px-5 py-3 text-sm font-bold transition ${activeTab === "all"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            All Users
          </button>

          <button
            onClick={() => setActiveTab("pending-agents")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${activeTab === "pending-agents"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            Pending Agents
            {pendingAgents.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {pendingAgents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("pending-students")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${activeTab === "pending-students"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            Pending Students
            {pendingStudents.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {pendingStudents.length}
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
            <div className="flex flex-col items-center justify-center bg-slate-50/50 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Retrieving system users...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
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
                      <th className="px-5 py-4">Module Access</th>
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
                                <p className="text-xs font-bold text-slate-700">
                                  {user.agencyDetails.agencyName}
                                </p>
                                <p className="text-[11px] leading-tight text-slate-500">
                                  Code: {user.agencyDetails.agencyCode || "N/A"}
                                  <br />
                                  {user.agencyDetails.agencyAddress &&
                                    `${user.agencyDetails.agencyAddress}, `}
                                  {user.agencyDetails.agencyCity}{" "}
                                  {user.agencyDetails.agencyCountry}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs italic text-slate-400">
                                No agency details
                              </span>
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
                                className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => handleRejectAgent(user.id)}
                                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
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
                              className="w-full max-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500"
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
                                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
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

                          <td className="max-w-[460px] px-5 py-4 text-xs text-slate-500">
                            {user.role === "SUPER_ADMIN"
                              ? "All Modules - VIEW / EDIT"
                              : renderModuleAccessSummary(user.moduleAccess)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${!user.isActive
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
                              <button
                                onClick={() => handleEditUser(user)}
                                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                              >
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
                        colSpan={
                          activeTab === "pending-agents"
                            ? 5
                            : activeTab === "pending-students"
                              ? 5
                              : 6
                        }
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {modalMode === "edit" ? "Edit User Access" : "Create User"}
                </h2>
                <p className="text-sm text-slate-500">
                  {modalMode === "edit"
                    ? "Edit only role and Module → Option → VIEW / EDIT access."
                    : "Create user and assign Module → Option → VIEW / EDIT access."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {modalMode === "create" && (
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
              )}

              {modalMode === "edit" && editingUser && (
                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Editing User
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {editingUser.fullName}
                  </h3>
                  <p className="text-sm text-slate-500">{editingUser.email}</p>
                </section>
              )}

              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  {modalMode === "edit" ? "Role" : "Role & Status"}
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="relative">
                    <select
                      value={form.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 pr-10 text-sm outline-none focus:border-indigo-500"
                    >
                      {creatableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  {modalMode === "create" && (
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
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 p-5">
                <h3 className="mb-1 text-sm font-bold text-slate-800">
                  Module Access
                </h3>

                <p className="mb-4 text-xs text-slate-500">
                  Select module, select option, then choose VIEW or EDIT action.
                </p>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-3 text-sm font-bold text-slate-800">
                      Select Module
                    </h4>

                    <div className="space-y-2">
                      {MODULE_ACCESS_OPTIONS.map((moduleItem) => {
                        const selectedCount = Object.values(
                          form.moduleAccess?.[moduleItem.module] || {}
                        ).filter((actions) => actions.length > 0).length;

                        return (
                          <button
                            key={moduleItem.module}
                            type="button"
                            onClick={() => setSelectedModule(moduleItem.module)}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selectedModule === moduleItem.module
                              ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                          >
                            <span>{moduleItem.module}</span>

                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
                              {selectedCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {selectedModule}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Select VIEW / EDIT for each option.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (selectedModuleData) {
                            toggleFullModule(
                              selectedModuleData.module,
                              selectedModuleData.options
                            );
                          }
                        }}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"
                      >
                        Select All / Clear All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedModuleData?.options.map((optionName) => {
                        const selectedActions =
                          form.moduleAccess?.[selectedModule]?.[optionName] ||
                          [];

                        return (
                          <div
                            key={optionName}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-slate-700">
                                {optionName}
                              </p>

                              {selectedActions.length > 0 && (
                                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                  {selectedActions.join(" / ")}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {ACTIONS.map((action) => (
                                <label
                                  key={action}
                                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${selectedActions.includes(action)
                                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedActions.includes(action)}
                                    onChange={() =>
                                      toggleOptionAction(
                                        selectedModule,
                                        optionName,
                                        action
                                      )
                                    }
                                    className="h-4 w-4 accent-indigo-600"
                                  />
                                  {action}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Selected Access Summary
                      </p>

                      {Object.keys(getCleanModuleAccess(form.moduleAccess))
                        .length === 0 ? (
                        <p className="text-sm font-semibold text-slate-400">
                          No module access selected.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(
                            getCleanModuleAccess(form.moduleAccess)
                          ).map(([moduleName, options]) => (
                            <div key={moduleName}>
                              <p className="text-xs font-bold text-slate-700">
                                {moduleName}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {Object.entries(options).map(
                                  ([optionName, actions]) => (
                                    <span
                                      key={optionName}
                                      className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                                    >
                                      {optionName}: {actions.join(" / ")}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-5">
              <button
                onClick={closeModal}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveUser}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                {modalMode === "edit" ? "Update Access" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
