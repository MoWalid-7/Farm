import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/Pagination.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { name: '', start_date: today(), bird_count: '', status: 'active', notes: '', end_date: '' };

export default function CyclesPage({ apiRequest, notify }) {
  const [cycles, setCycles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewCycle, setViewCycle] = useState(null);
  const debounceRef = useRef(null);

  const loadCycles = useCallback(async (pageNum = 1, q = search, st = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, per_page: 15 });
      if (q.trim()) params.set('search', q.trim());
      if (st) params.set('status', st);
      const res = await apiRequest(`/cycles?${params}`);
      setCycles(res.data?.data || []);
      setMeta(res.data?.meta || res.data);
    } catch (e) { notify('error', e.message); }
    finally { setLoading(false); }
  }, [apiRequest, notify, search, statusFilter]);

  useEffect(() => { loadCycles(page); }, [page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); loadCycles(1, val, statusFilter); }, 400);
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
    loadCycles(1, search, val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        name: form.name,
        start_date: form.start_date,
        bird_count: Number(form.bird_count),
        status: form.status,
        notes: form.notes || null,
        end_date: form.status === 'completed' && form.end_date ? form.end_date : null,
      };
      if (editId) {
        await apiRequest(`/cycles/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('success', 'تم تحديث بيانات الدورة بنجاح.');
      } else {
        await apiRequest('/cycles', { method: 'POST', body: JSON.stringify(payload) });
        notify('success', 'تم إضافة الدورة بنجاح.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      loadCycles(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (cycle) => {
    setForm({
      name: cycle.name,
      start_date: cycle.start_date?.slice(0, 10) || today(),
      bird_count: cycle.bird_count || '',
      status: cycle.status || 'active',
      notes: cycle.notes || '',
      end_date: cycle.end_date?.slice(0, 10) || '',
    });
    setEditId(cycle.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await apiRequest(`/cycles/${deleteTarget.id}`, { method: 'DELETE' });
      notify('success', `تم حذف الدورة "${deleteTarget.name}" بنجاح.`);
      setDeleteTarget(null);
      loadCycles(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const fmtNum = (v) => v != null ? Number(v).toLocaleString('ar-EG') : '—';

  return (
    <section className="card panel">
      <div className="page-header">
        <h2>🔄 إدارة الدورات</h2>
        <button className="primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(s => !s); }}>
          {showForm ? '✕ إغلاق' : '+ إضافة دورة'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <h3>{editId ? '✏️ تعديل بيانات الدورة' : '➕ إضافة دورة جديدة'}</h3>
          <form onSubmit={handleSubmit} className="field-grid">
            <label>اسم/رقم الدورة<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: دورة 1 أو سبتمبر 2026" /></label>
            <label>تاريخ البداية<input type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></label>
            <label>عدد الطيور<input type="number" min="1" required value={form.bird_count} onChange={e => setForm({ ...form, bird_count: e.target.value })} placeholder="مثال: 5000" /></label>
            <label>الحالة
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">نشطة</option>
                <option value="completed">منتهية</option>
              </select>
            </label>
            {form.status === 'completed' && (
              <label>تاريخ النهاية<input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></label>
            )}
            <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات اختيارية..." /></label>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={formLoading}>{formLoading ? 'جارٍ الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة الدورة'}</button>
              <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="table-filters">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="table-search" placeholder="ابحث باسم أو رقم الدورة..." value={search} onChange={e => handleSearch(e.target.value)} />
          {search && <button className="clear-search" onClick={() => handleSearch('')}>✕</button>}
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => handleStatusFilter(e.target.value)}>
          <option value="">كل الدورات</option>
          <option value="active">نشطة</option>
          <option value="completed">منتهية</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="table-loading"><div className="spinner" /><span>جارٍ التحميل...</span></div>
        ) : cycles.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">🔄</div>
            <p>{search ? `لا توجد نتائج للبحث "${search}"` : 'لا توجد دورات مسجلة بعد'}</p>
            {!search && <button className="primary" onClick={() => setShowForm(true)}>إضافة أول دورة</button>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الدورة</th>
                <th>عدد الطيور</th>
                <th>تاريخ البداية</th>
                <th>تاريخ النهاية</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((c, i) => (
                <tr key={c.id}>
                  <td className="text-muted">{((meta?.current_page || 1) - 1) * 15 + i + 1}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{fmtNum(c.bird_count)} طير</td>
                  <td>{c.start_date?.slice(0, 10) || '—'}</td>
                  <td>{c.end_date?.slice(0, 10) || '—'}</td>
                  <td><span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{c.status === 'active' ? 'نشطة' : 'منتهية'}</span></td>
                  <td className="text-muted">{c.notes ? (c.notes.length > 30 ? c.notes.slice(0, 30) + '...' : c.notes) : '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action btn-view" title="عرض التفاصيل" onClick={() => setViewCycle(c)}>👁️</button>
                      <button className="btn-action btn-edit" title="تعديل" onClick={() => handleEdit(c)}>✏️</button>
                      <button className="btn-action btn-delete" title="حذف" onClick={() => setDeleteTarget(c)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={meta} onPageChange={p => { setPage(p); loadCycles(p); }} />

      {/* View Modal */}
      {viewCycle && (
        <div className="modal-overlay" onClick={() => setViewCycle(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 {viewCycle.name}</h3>
              <button className="modal-close" onClick={() => setViewCycle(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><span>عدد الطيور</span><strong>{fmtNum(viewCycle.bird_count)} طير</strong></div>
              <div className="detail-item"><span>تاريخ البداية</span><strong>{viewCycle.start_date?.slice(0, 10) || '—'}</strong></div>
              <div className="detail-item"><span>تاريخ النهاية</span><strong>{viewCycle.end_date?.slice(0, 10) || '—'}</strong></div>
              <div className="detail-item"><span>الحالة</span><span className={`badge ${viewCycle.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{viewCycle.status === 'active' ? 'نشطة' : 'منتهية'}</span></div>
              {viewCycle.notes && <div className="detail-item full-width"><span>ملاحظات</span><strong>{viewCycle.notes}</strong></div>}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="حذف الدورة"
        message={`هل تريد حذف الدورة "${deleteTarget?.name}"؟ لا يمكن حذف دورة مرتبطة بمبيعات أو أوزان.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={formLoading}
      />
    </section>
  );
}
