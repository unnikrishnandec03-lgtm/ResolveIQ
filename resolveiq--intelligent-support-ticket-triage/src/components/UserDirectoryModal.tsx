import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Shield,
  Calendar,
  RefreshCw,
  Download,
  X,
  UserCheck,
  Check
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { fetchAllRegisteredUsers } from '../lib/authService';

interface UserDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const UserDirectoryModal: React.FC<UserDirectoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllRegisteredUsers();
      // If current user isn't in data yet, prepend
      if (currentUser && !data.some(u => u.uid === currentUser.uid)) {
        setUsers([currentUser, ...data]);
      } else {
        setUsers(data);
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile.includes(search) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(id);
    setTimeout(() => setCopiedUid(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-heading font-black text-slate-900 dark:text-white truncate">Registered Users Database</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold shrink-0">
                  {users.length} Enrolled
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Firestore collection: <code className="text-purple-600 dark:text-purple-300 font-mono">/users</code> (Name, Mobile, Email, Role)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadUsers}
              disabled={loading}
              title="Refresh database"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-3 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, mobile number, or email..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Users Table / Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-w-0">
          {filteredUsers.map(user => {
            const isMe = currentUser?.uid === user.uid;
            return (
              <div
                key={user.uid}
                className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 overflow-hidden ${
                  isMe
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/40 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">{user.name}</span>
                    {isMe && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-1.5 py-0.2 rounded font-medium shrink-0">
                        You
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                      {user.role}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300 break-all">{user.email}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="font-mono text-slate-700 dark:text-slate-300">{user.mobile}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => copyToClipboard(user.email, user.uid)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono transition flex items-center gap-1 whitespace-nowrap"
                  >
                    {copiedUid === user.uid ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <span>Copy Email</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No registered users match your search.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Security: Verified ABAC Rules Active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
