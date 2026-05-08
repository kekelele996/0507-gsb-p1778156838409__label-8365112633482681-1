import React, { useState, useEffect } from 'react';
import { Home, Users, FileText, Phone, Heart, LogOut, User, Plus, X, Search, Pencil, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicDashboard from './PublicDashboard';

const API_URL = '/src/api';

// Toast Notification Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Shared utility functions for authentication
function getCurrentUserRole() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    return user.role || 'user';
  }
  return 'user';
}

function getAuthHeaders() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    // Use the token from login, don't regenerate
    const token = user.token || btoa(`${user.id}:${user.username}:${Date.now()}`);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return { 'Content-Type': 'application/json' };
}

function ConfirmDialog({ open, title, message, confirmText, cancelText, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-gray-600">{message}</div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Death Records Module Component
function DeathRecordsModule({ onRefresh }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmState, setConfirmState] = useState({ open: false });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = search
        ? `${API_URL}/death_records.php/list?page=${page}&limit=10&search=${search}`
        : `${API_URL}/death_records.php/list?page=${page}&limit=10`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingRecord
      ? `${API_URL}/death_records.php/${editingRecord.id}`
      : `${API_URL}/death_records.php`;
    const method = editingRecord ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setEditingRecord(null);
        setFormData({});
        fetchRecords();
        onRefresh?.();
        showToast('操作成功');
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData(record);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/death_records.php/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
        onRefresh?.();
        showToast('删除成功');
      } else {
        showToast('删除失败', 'error');
      }
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const requestDelete = (record) => {
    setConfirmState({
      open: true,
      title: '删除确认',
      message: `确定删除 ${record.name} 的死亡登记记录吗？`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        closeConfirm();
        await handleDelete(record.id);
      },
    });
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      name: '', id_card: '', gender: '男', death_date: '',
      death_reason: '', village: '',
    });
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索姓名、身份证、村..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 shadow-md">
          <Plus className="w-5 h-5" /> 添加记录
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">身份证</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">性别</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">死亡日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">村庄</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.id_card}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.gender}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.death_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.village}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => requestDelete(r)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">上一页</button>
              <span className="px-3 py-1">第 {page}/{pagination.pages} 页</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1 border rounded">下一页</button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white">{editingRecord ? '编辑' : '添加'}记录</h2>
              <button onClick={() => setModalOpen(false)} className="text-white hover:bg-red-700 rounded p-1"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">姓名 *</label>
                  <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">身份证 *</label>
                  <input type="text" required value={formData.id_card || ''} onChange={(e) => setFormData({ ...formData, id_card: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">性别 *</label>
                  <select required value={formData.gender || '男'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="男">男</option><option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">死亡日期 *</label>
                  <input type="date" required value={formData.death_date || ''} onChange={(e) => setFormData({ ...formData, death_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">死亡原因 *</label>
                  <input type="text" required value={formData.death_reason || ''} onChange={(e) => setFormData({ ...formData, death_reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">村庄 *</label>
                  <input type="text" required value={formData.village || ''} onChange={(e) => setFormData({ ...formData, village: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md">{editingRecord ? '更新' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Village Contacts Module Component
function VillageContactsModule({ onRefresh }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmState, setConfirmState] = useState({ open: false });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const url = search
        ? `${API_URL}/village_contacts.php/list?page=${page}&limit=10&search=${search}`
        : `${API_URL}/village_contacts.php/list?page=${page}&limit=10`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingContact
      ? `${API_URL}/village_contacts.php/${editingContact.id}`
      : `${API_URL}/village_contacts.php`;
    const method = editingContact ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setEditingContact(null);
        setFormData({});
        fetchContacts();
        onRefresh?.();
        showToast('操作成功');
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData(contact);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/village_contacts.php/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchContacts();
        onRefresh?.();
        showToast('删除成功');
      } else {
        showToast('删除失败', 'error');
      }
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const requestDelete = (contact) => {
    setConfirmState({
      open: true,
      title: '删除确认',
      message: `确定删除 ${contact.name} 的联系人信息吗？`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        closeConfirm();
        await handleDelete(contact.id);
      },
    });
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', village: '', phone: '', position: '', status: 'active' });
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索姓名、村庄、电话..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-md">
          <Plus className="w-5 h-5" /> 添加联系人
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <p className="text-sm text-emerald-600 font-medium">{c.position || '联系人'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {c.status === 'active' ? '活跃' : '停用'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <p>📍 {c.village}</p>
                <p>📞 {c.phone}</p>
                {c.email && <p>✉️ {c.email}</p>}
              </div>
              <div className="flex gap-2 pt-3 border-t">
                <button onClick={() => handleEdit(c)} className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                <button onClick={() => requestDelete(c)} className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">删除</button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">暂无数据</div>}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white">{editingContact ? '编辑' : '添加'}联系人</h2>
              <button onClick={() => setModalOpen(false)} className="text-white hover:bg-emerald-700 rounded p-1"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">姓名 *</label><input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium mb-1">村庄 *</label><input type="text" required value={formData.village || ''} onChange={(e) => setFormData({ ...formData, village: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium mb-1">职务</label><input type="text" value={formData.position || ''} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="如：村主任、会计等" /></div>
                <div><label className="block text-sm font-medium mb-1">电话 *</label><input type="text" required value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium mb-1">邮箱</label><input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium mb-1">状态</label><select value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"><option value="active">活跃</option><option value="inactive">停用</option></select></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md">{editingContact ? '更新' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Subsistence Module Component
function SubsistenceModule({ onRefresh }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmState, setConfirmState] = useState({ open: false });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = search
        ? `${API_URL}/subsistence.php/list?page=${page}&limit=10&search=${search}`
        : `${API_URL}/subsistence.php/list?page=${page}&limit=10`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingRecord
      ? `${API_URL}/subsistence.php/${editingRecord.id}`
      : `${API_URL}/subsistence.php`;
    const method = editingRecord ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setEditingRecord(null);
        setFormData({});
        fetchRecords();
        onRefresh?.();
        showToast('操作成功');
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData(record);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/subsistence.php/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
        onRefresh?.();
        showToast('删除成功');
      } else {
        showToast('删除失败', 'error');
      }
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const requestDelete = (record) => {
    setConfirmState({
      open: true,
      title: '删除确认',
      message: `确定删除 ${record.name} 的低保记录吗？`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        closeConfirm();
        await handleDelete(record.id);
      },
    });
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      name: '', id_card: '', village: '', family_count: 1,
      allowance_amount: 0, status: 'active',
    });
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索姓名、身份证、村..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md">
          <Plus className="w-5 h-5" /> 添加低保户
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">身份证</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">村庄</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">家庭人口</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">月补助</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.id_card}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.village}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.family_count}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600">¥{r.allowance_amount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.status === 'active' ? '享受中' : '停发'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => requestDelete(r)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">上一页</button>
              <span className="px-3 py-1">第 {page}/{pagination.pages} 页</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1 border rounded">下一页</button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white">{editingRecord ? '编辑' : '添加'}低保户</h2>
              <button onClick={() => setModalOpen(false)} className="text-white hover:bg-blue-700 rounded p-1"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">姓名 *</label><input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">身份证 *</label><input type="text" required value={formData.id_card || ''} onChange={(e) => setFormData({ ...formData, id_card: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">村庄 *</label><input type="text" required value={formData.village || ''} onChange={(e) => setFormData({ ...formData, village: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">家庭人口 *</label><input type="number" required min="1" value={formData.family_count || 1} onChange={(e) => setFormData({ ...formData, family_count: parseInt(e.target.value, 10) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">月补助(元) *</label><input type="number" required min="0" step="0.01" value={formData.allowance_amount || 0} onChange={(e) => setFormData({ ...formData, allowance_amount: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">状态</label><select value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value="active">享受中</option><option value="inactive">停发</option></select></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">{editingRecord ? '更新' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Special Assistance Module Component
function SpecialAssistanceModule({ onRefresh }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmState, setConfirmState] = useState({ open: false });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = search
        ? `${API_URL}/special_assistance.php/list?page=${page}&limit=10&search=${search}`
        : `${API_URL}/special_assistance.php/list?page=${page}&limit=10`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingRecord
      ? `${API_URL}/special_assistance.php/${editingRecord.id}`
      : `${API_URL}/special_assistance.php`;
    const method = editingRecord ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setEditingRecord(null);
        setFormData({});
        fetchRecords();
        onRefresh?.();
        showToast('操作成功');
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/special_assistance.php/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
        onRefresh?.();
        showToast('删除成功');
      } else {
        showToast('删除失败', 'error');
      }
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const requestDelete = (record) => {
    setConfirmState({
      open: true,
      title: '删除确认',
      message: `确定删除 ${record.name} 的特困供养记录吗？`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        closeConfirm();
        await handleDelete(record.id);
      },
    });
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      name: '', id_card: '', village: '', assistance_type: '分散供养',
      monthly_amount: 0, status: 'active', health_status: '健康',
    });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    const { allowance_standard, ...formRecord } = record;
    setFormData(formRecord);
    setModalOpen(true);
  };

  const getTypeBadge = (type) => {
    const badges = {
      '分散供养': 'bg-purple-100 text-purple-700',
      '集中供养': 'bg-indigo-100 text-indigo-700',
      '其他': 'bg-gray-100 text-gray-700',
    };
    return badges[type] || badges['其他'];
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索姓名、身份证、村..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-md">
          <Plus className="w-5 h-5" /> 添加特困人员
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">身份证</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">村庄</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">供养类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">月补助</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">健康</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.id_card}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.village}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(r.assistance_type)}`}>{r.assistance_type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-purple-600">¥{r.monthly_amount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.health_status || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => requestDelete(r)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">上一页</button>
              <span className="px-3 py-1">第 {page}/{pagination.pages} 页</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1 border rounded">下一页</button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white">{editingRecord ? '编辑' : '添加'}特困人员</h2>
              <button onClick={() => setModalOpen(false)} className="text-white hover:bg-purple-700 rounded p-1"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">姓名 *</label><input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-sm font-medium mb-1">身份证 *</label><input type="text" required value={formData.id_card || ''} onChange={(e) => setFormData({ ...formData, id_card: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-sm font-medium mb-1">村庄 *</label><input type="text" required value={formData.village || ''} onChange={(e) => setFormData({ ...formData, village: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-sm font-medium mb-1">供养类型 *</label><select required value={formData.assistance_type || '分散供养'} onChange={(e) => setFormData({ ...formData, assistance_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"><option value="分散供养">分散供养</option><option value="集中供养">集中供养</option><option value="其他">其他</option></select></div>
                <div><label className="block text-sm font-medium mb-1">月补助(元) *</label><input type="number" required min="0" step="0.01" value={formData.monthly_amount || 0} onChange={(e) => setFormData({ ...formData, monthly_amount: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-sm font-medium mb-1">健康状况</label><select value={formData.health_status || '健康'} onChange={(e) => setFormData({ ...formData, health_status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"><option value="健康">健康</option><option value="残疾">残疾</option><option value="患病">患病</option><option value="失能">失能</option></select></div>
                <div><label className="block text-sm font-medium mb-1">状态</label><select value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"><option value="active">享受中</option><option value="inactive">停发</option></select></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md">{editingRecord ? '更新' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Users Management Module
function UsersModule() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmState, setConfirmState] = useState({ open: false });
  const [toast, setToast] = useState(null); // Toast state

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const currentUserRole = getCurrentUserRole();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin.php/users`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        const res = await fetch(`${API_URL}/admin.php/users/${editingUser.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setModalOpen(false);
          setEditingUser(null);
          setFormData({});
          fetchUsers();
          showToast('用户更新成功');
        } else {
          showToast(data.error || '更新用户失败', 'error');
        }
      } else {
        // Create new user
        const res = await fetch(`${API_URL}/admin.php/users`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setModalOpen(false);
          setFormData({});
          fetchUsers();
          showToast('用户创建成功');
        } else {
          showToast(data.error || '创建用户失败', 'error');
        }
      }
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '', // Don't pre-fill password
      role: user.role,
      status: user.status === 1 || user.status === 'active' ? 'active' : 'inactive',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin.php/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        showToast('用户删除成功');
      } else {
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast('删除失败', 'error');
    }
  };

  const requestDelete = (user) => {
    setConfirmState({
      open: true,
      title: '删除确认',
      message: `确定删除用户 ${user.username} 吗？`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        closeConfirm();
        await handleDelete(user.id);
      },
    });
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      role: 'user',
      status: 'active',
    });
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">用户管理</h2>
        {currentUserRole === 'admin' && (
          <button onClick={openAddModal} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 shadow-md">
            <Plus className="w-5 h-5" /> 添加用户
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{u.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${u.status === 1 || u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.status === 1 || u.status === 'active' ? '活跃' : '停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {currentUserRole === 'admin' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(u)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => requestDelete(u)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                    {currentUserRole !== 'admin' && (
                      <span className="text-gray-400 text-sm">无权限</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">暂无用户</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white">{editingUser ? '编辑用户' : '添加用户'}</h2>
              <button onClick={() => { setModalOpen(false); setEditingUser(null); setFormData({}); }} className="text-white hover:bg-purple-700 rounded p-1"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">用户名</label>
                <input type="text" required value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">密码{editingUser && ' (留空保持不变)'}</label>
                <input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder={editingUser ? '留空不修改' : ''} required={!editingUser} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">邮箱</label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">角色</label>
                <select value={formData.role || 'user'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="admin">管理员</option><option value="user">普通用户</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">状态</label>
                <select value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="active">启用</option><option value="inactive">停用</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setModalOpen(false); setEditingUser(null); setFormData({}); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md">{editingUser ? '更新' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Main Admin Panel Component
export default function AdminPanel({ user, onLogout, onSwitchToDashboard }) {
  const [activeTab, setActiveTab] = useState('death_records');
  const [refreshKey, setRefreshKey] = useState(0);
  const currentUserRole = getCurrentUserRole();

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  // Filter tabs based on user role - only admin can see user management
  const allTabs = [
    { id: 'death_records', label: '死亡登记', icon: FileText, color: 'text-red-600' },
    { id: 'village_contacts', label: '村级联系人', icon: Phone, color: 'text-emerald-600' },
    { id: 'subsistence', label: '低保管理', icon: Users, color: 'text-blue-600' },
    { id: 'special_assistance', label: '特困供养', icon: Heart, color: 'text-purple-600' },
    { id: 'users', label: '用户管理', icon: User, color: 'text-gray-600', adminOnly: true },
  ];

  const tabs = allTabs.filter(tab => !tab.adminOnly || currentUserRole === 'admin');

  const tabContent = {
    death_records: <DeathRecordsModule key={refreshKey} onRefresh={handleRefresh} />,
    village_contacts: <VillageContactsModule key={refreshKey} onRefresh={handleRefresh} />,
    subsistence: <SubsistenceModule key={refreshKey} onRefresh={handleRefresh} />,
    special_assistance: <SpecialAssistanceModule key={refreshKey} onRefresh={handleRefresh} />,
    users: <UsersModule key={refreshKey} />,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">后台管理系统</h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-purple-600' : tab.color}`} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-700">欢迎, {user?.username}</span>
              {onSwitchToDashboard && (
                <button onClick={onSwitchToDashboard} className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Home className="w-4 h-4 mr-1" />
                  查看首页
                </button>
              )}
              <button onClick={onLogout} className="inline-flex items-center px-3 py-2 border border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50">
                <LogOut className="w-4 h-4 mr-1" />
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="sm:hidden border-b border-gray-200 bg-white px-4 overflow-x-auto">
        <div className="flex space-x-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className={`w-4 h-4 mr-1 ${activeTab === tab.id ? 'text-purple-600' : tab.color}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          {tabContent[activeTab]}
        </div>
      </main>
    </div>
  );
}
