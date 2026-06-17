import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  KeyRound, 
  AlertCircle,
  CheckCircle,
  UserCheck
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('Please provide username and password');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users', { username, password, role });
      setSuccess(`User "${username}" created successfully`);
      setUsername('');
      setPassword('');
      setRole('operator');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const activeUsername = localStorage.getItem('username');
    if (activeUsername === name) {
      alert('You cannot delete your own active administrator account!');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/users/${id}`, { role: newRole });
      setUsers(users.map((u) => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">User Management Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Add system operators, assign credentials, and manage role permission hierarchies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table List */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Registered System Users</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Username</th>
                  <th className="p-4">Role Access</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-800 dark:text-white">
                      {user.username}
                    </td>
                    <td className="p-4">
                      {/* Only select edit if it is not the current user logged in */}
                      {localStorage.getItem('username') === user.username ? (
                        <span className="px-2.5 py-1 bg-emerald-150 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 w-fit">
                          <Shield className="w-3.5 h-3.5" />
                          {user.role} (You)
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="operator">Operator</option>
                        </select>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        disabled={localStorage.getItem('username') === user.username}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Card Form */}
        <div className="glass p-6 rounded-2xl shadow-sm h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
            <UserPlus className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Create Account</h3>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 text-xs">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="new-username-input">Username</label>
              <div className="relative">
                <input
                  id="new-username-input"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="new-password-input">Password</label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2" htmlFor="new-role-select">Role Access Level</label>
              <select
                id="new-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="operator">Operator (View Stream/Logs)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <button
              id="create-user-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
