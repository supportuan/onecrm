'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Loader2, Search } from 'lucide-react';
import { getUsers, createUser, deleteUser, getCounsellors } from '../../services/userApi';
import { convertStudentToLead } from '../../services/marketingApi';

const roles = ['ADMIN', 'COUNSELLOR', 'STUDENT', 'HR'];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [counsellors, setCounsellors] = useState([]);
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [conversionUserId, setConversionUserId] = useState(null);
  const [conversionForm, setConversionForm] = useState({
    assignedCounsellorId: '',
    preferredCourse: '',
    preferredCountry: '',
  });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'COUNSELLOR',
  });

  const loadUsers = async () => {
    setLoading(true);

    try {
      const res = await getUsers(roleFilter);

      if (res.success) {
        const data = res.data || [];

        const filtered = search
          ? data.filter((u) =>
              `${u.fullName} ${u.email} ${u.phone || ''} ${u.role}`
                .toLowerCase()
                .includes(search.toLowerCase())
            )
          : data;

        setUsers(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, search]);

  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        const res = await getCounsellors();
        if (res.success) {
          setCounsellors(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch counsellors:', err);
      }
    };
    fetchCounsellors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await createUser(form);

    if (res.success) {
      setIsOpen(false);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        role: 'COUNSELLOR',
      });
      loadUsers();
    } else {
      alert(res.message || 'Failed to create user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;

    const res = await deleteUser(id);

    if (res.success) {
      loadUsers();
    } else {
      alert(res.message || 'Failed to deactivate user');
    }
  };

  const handleConvertToLeadClick = (userId) => {
    setConversionUserId(userId);
    setConversionForm({
      assignedCounsellorId: '',
      preferredCourse: '',
      preferredCountry: '',
    });
    setIsConversionOpen(true);
  };

  const handleConversionSubmit = async (e) => {
    e.preventDefault();
    try {
      const overrides = {
        assignedCounsellorId: conversionForm.assignedCounsellorId ? parseInt(conversionForm.assignedCounsellorId, 10) : null,
        preferredCourse: conversionForm.preferredCourse || null,
        preferredCountry: conversionForm.preferredCountry || null,
      };
      const res = await convertStudentToLead(conversionUserId, overrides);
      if (res.success) {
        alert('Student successfully converted to lead!');
        setIsConversionOpen(false);
        setConversionUserId(null);
        loadUsers();
      } else {
        alert(res.message || 'Failed to convert student to lead');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error occurred while converting student to lead.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">User Management</h1>
            <p className="text-sm text-neutral-500 font-semibold mt-1">
              Create Admin, Counsellor, Student and HR users
            </p>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5">
            <Search className="h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold outline-none text-neutral-700"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-700"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-neutral-500">Name</th>
                <th className="px-6 py-4 text-sm font-bold text-neutral-500">Email</th>
                <th className="px-6 py-4 text-sm font-bold text-neutral-500">Phone</th>
                <th className="px-6 py-4 text-sm font-bold text-neutral-500">Role</th>
                <th className="px-6 py-4 text-sm font-bold text-neutral-500">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-neutral-500 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-semibold text-neutral-800">
                    {user.fullName}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-neutral-700 text-xs font-bold">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {user.role === 'STUDENT' && (
                        <button
                          onClick={() => handleConvertToLeadClick(user.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm transition-all"
                          title="Convert to Marketing Lead"
                        >
                          Convert to Lead
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-neutral-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-16 text-neutral-500 font-semibold"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-auto shadow-sm">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Create User</h2>
                <p className="text-xs text-neutral-500 font-semibold mt-1">
                  Add user with role-based access
                </p>
              </div>

              <button onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500">
                  Full Name *
                </label>
                <input
                  required
                  placeholder="Emma Davis"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className="w-full mt-1 border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-500">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  placeholder="emma@onecrm.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full mt-1 border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-500">
                  Phone
                </label>
                <input
                  placeholder="+919999999999"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full mt-1 border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-500">
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full mt-1 border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="border border-neutral-200 px-5 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      {isConversionOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-auto shadow-sm">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Convert Student to Lead</h2>
                <p className="text-xs text-neutral-500 font-semibold mt-1">
                  Assign counsellor and capture student metadata for follow-up
                </p>
              </div>

              <button onClick={() => setIsConversionOpen(false)}>
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleConversionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 font-bold">
                  Assigned Counsellor (Optional)
                </label>
                <select
                  value={conversionForm.assignedCounsellorId}
                  onChange={(e) =>
                    setConversionForm((p) => ({ ...p, assignedCounsellorId: e.target.value }))
                  }
                  className="w-full mt-1 border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                >
                  <option value="">Select counsellor</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-500 font-bold">
                  Preferred Course (Optional)
                </label>
                <input
                  placeholder="e.g. Master of Business Administration"
                  value={conversionForm.preferredCourse}
                  onChange={(e) =>
                    setConversionForm((p) => ({ ...p, preferredCourse: e.target.value }))
                  }
                  className="w-full mt-1 border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-500 font-bold">
                  Preferred Country (Optional)
                </label>
                <input
                  placeholder="e.g. Canada"
                  value={conversionForm.preferredCountry}
                  onChange={(e) =>
                    setConversionForm((p) => ({ ...p, preferredCountry: e.target.value }))
                  }
                  className="w-full mt-1 border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsConversionOpen(false)}
                  className="border border-neutral-200 px-5 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Convert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;