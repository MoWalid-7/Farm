import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/Pagination.jsx';

const STATUSES = [
  { value: '', label: 'جميع العمال' },
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
];

const emptyForm = { name: '', phone: '', job_title: '', daily_wage: '', status: 'active' };

export default function WorkersPage({ apiRequest, notify, fmt }) {
  const [workers, setWorkers] = useState([]);
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
  const [viewWorker, setViewWorker] = useState(null);
  const debounceRef = useRef(null);

  const loadWorkers = useCallback(async (pageNum = 1, q = search, st = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, per_page: 15 });
      if (q.trim()) params.set('search', q.trim());
      if (st) params.set('status', st);
      const res = await apiRequest(`/workers?${params}`);
      setWorkers(res.data?.data || []);
      setMeta(res.data?.meta || res.data);
    } catch (e) { notify('error', e.message); }
    finally { setLoading(false); }
  }, [apiRequest, notify, search, statusFilter]);

  useEffect(() => { loadWorkers(page); }, [page]);

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); loadWorkers(1, val, statusFilter); }, 400);
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
    loadWorkers(1, search, val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editId) {
        await apiRequest(`/workers/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
        notify('success', 'تم تحديث بيانات العامل بنجاح.');
      } else {
        await apiRequest('/workers', { method: 'POST', body: JSON.stringify(form) });
        notify('success', 'تم إضافة العامل بنجاح.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      loadWorkers(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (worker) => {
    setForm({ name: worker.name, phone: worker.phone || '', job_title: worker.job_title || '', daily_wage: worker.daily_wage || '', status: worker.status || 'active' });
    setEditId(worker.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await apiRequest(`/workers/${deleteTarget.id}`, { method: 'DELETE' });
      notify('success', `تم حذف العامل "${deleteTarget.name}" بنجاح.`);
      setDeleteTarget(null);
      loadWorkers(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const handleView = async (worker) => {
    try {
      const res = await apiRequest(`/workers/${worker.id}`);
      setViewWorker(res.data);
    } catch (e) { notify('error', e.message); }
  };

  const fmtNum = (v) => v !== null && v !== undefined ? Number(v).toLocaleString('ar-EG') : '—';

  return (
    <section className="card panel">
      <div className="page-header">
        <h2>👷 إدارة العمال</h2>
        <button className="primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(s => !s); }}>
          {showForm ? '✕ إغلاق' : '+ إضافة عامل'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <h3>{editId ? '✏️ تعديل بيانات العامل' : '➕ إضافة عامل جديد'}</h3>
          <form onSubmit={handleSubmit} className="field-grid">
            <label>الاسم الكامل<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: أحمد محمد" /></label>
            <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" /></label>
            <label>الوظيفة<input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder="مثال: عامل تغذية" /></label>
            <label>الأجر اليومي (ج.م)<input type="number" min="0" step="0.01" value={form.daily_wage} onChange={e => setForm({ ...form, daily_wage: e.target.value })} placeholder="0.00" /></label>
            <label>الحالة<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">نشط</option><option value="inactive">غير نشط</option>
            </select></label>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={formLoading}>{formLoading ? 'جارٍ الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة العامل'}</button>
              <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="table-filters">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="table-search" placeholder="ابحث بالاسم أو الهاتف أو الوظيفة..." value={search} onChange={e => handleSearch(e.target.value)} />
          {search && <button className="clear-search" onClick={() => handleSearch('')}>✕</button>}
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => handleStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="table-loading"><div className="spinner" /><span>جارٍ التحميل...</span></div>
        ) : workers.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">👷</div>
            <p>{search ? `لا توجد نتائج للبحث "${search}"` : 'لا يوجد عمال مسجلون بعد'}</p>
            {!search && <button className="primary" onClick={() => setShowForm(true)}>إضافة أول عامل</button>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الوظيفة</th>
                <th>الأجر اليومي</th>
                <th>إجمالي المدفوع</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w, i) => (
                <tr key={w.id}>
                  <td className="text-muted">{((meta?.current_page || 1) - 1) * 15 + i + 1}</td>
                  <td><strong>{w.name}</strong></td>
                  <td>{w.phone || '—'}</td>
                  <td>{w.job_title || '—'}</td>
                  <td>{w.daily_wage ? `${fmtNum(w.daily_wage)} ج.م` : '—'}</td>
                  <td className="text-success">{w.payments_sum_amount ? `${fmtNum(w.payments_sum_amount)} ج.م` : '—'}</td>
                  <td><span className={`badge ${w.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{w.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action btn-view" title="عرض التفاصيل" onClick={() => handleView(w)}>👁️</button>
                      <button className="btn-action btn-edit" title="تعديل" onClick={() => handleEdit(w)}>✏️</button>
                      <button className="btn-action btn-delete" title="حذف" onClick={() => setDeleteTarget(w)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={meta} onPageChange={(p) => { setPage(p); loadWorkers(p); }} />

      {/* View Modal */}
      {viewWorker && (
        <div className="modal-overlay" onClick={() => setViewWorker(null)}>
          <div className="modal-box modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👷 {viewWorker.name}</h3>
              <button className="modal-close" onClick={() => setViewWorker(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><span>الهاتف</span><strong>{viewWorker.phone || '—'}</strong></div>
              <div className="detail-item"><span>الوظيفة</span><strong>{viewWorker.job_title || '—'}</strong></div>
              <div className="detail-item"><span>الأجر اليومي</span><strong>{viewWorker.daily_wage ? `${fmtNum(viewWorker.daily_wage)} ج.م` : '—'}</strong></div>
              <div className="detail-item"><span>الحالة</span><span className={`badge ${viewWorker.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{viewWorker.status === 'active' ? 'نشط' : 'غير نشط'}</span></div>
            </div>
            {viewWorker.payments?.length > 0 && (
              <>
                <h4 style={{margin:'16px 0 10px'}}>سجل الدفعات</h4>
                <div className="table-wrap" style={{marginTop:0}}>
                  <table>
                    <thead><tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظات</th></tr></thead>
                    <tbody>
                      {viewWorker.payments.map(p => (
                        <tr key={p.id}><td>{p.payment_date}</td><td>{fmtNum(p.amount)} ج.م</td><td>{p.notes || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="حذف العامل"
        message={`هل تريد حذف العامل "${deleteTarget?.name}"؟ سيتم حذف جميع بياناته بشكل نهائي.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={formLoading}
      />
    </section>
  );
}
