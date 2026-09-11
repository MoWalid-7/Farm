import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/Pagination.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { worker_id: '', amount: '', notes: '', date: today() };

export default function WorkerPaymentsPage({ apiRequest, notify, workers }) {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const debounceRef = useRef(null);

  const buildParams = (pageNum, q, wf, df, dt) => {
    const p = new URLSearchParams({ page: pageNum, per_page: 15 });
    if (q?.trim()) p.set('search', q.trim());
    if (wf) p.set('worker_id', wf);
    if (df) p.set('date_from', df);
    if (dt) p.set('date_to', dt);
    return p;
  };

  const loadPayments = useCallback(async (pageNum = 1, q = search, wf = workerFilter, df = dateFrom, dt = dateTo) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/worker-payments?${buildParams(pageNum, q, wf, df, dt)}`);
      setPayments(res.data?.data || []);
      setMeta(res.data?.meta || res.data);
      setTotalAmount(res.meta?.total_amount || 0);
    } catch (e) { notify('error', e.message); }
    finally { setLoading(false); }
  }, [apiRequest, notify, search, workerFilter, dateFrom, dateTo]);

  useEffect(() => { loadPayments(page); }, [page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); loadPayments(1, val, workerFilter, dateFrom, dateTo); }, 400);
  };

  const applyFilters = () => { setPage(1); loadPayments(1, search, workerFilter, dateFrom, dateTo); };
  const clearFilters = () => { setSearch(''); setWorkerFilter(''); setDateFrom(''); setDateTo(''); setPage(1); loadPayments(1, '', '', '', ''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.worker_id) { notify('error', 'يجب اختيار عامل.'); return; }
    setFormLoading(true);
    try {
      const payload = { worker_id: form.worker_id, amount: form.amount, notes: form.notes, payment_date: form.date };
      if (editId) {
        await apiRequest(`/worker-payments/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('success', 'تم تحديث الدفعة بنجاح.');
      } else {
        await apiRequest('/worker-payments', { method: 'POST', body: JSON.stringify(payload) });
        notify('success', 'تم تسجيل الدفعة بنجاح.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      loadPayments(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (payment) => {
    setForm({ worker_id: payment.worker_id || payment.worker?.id || '', amount: payment.amount, notes: payment.notes || '', date: payment.payment_date?.slice(0, 10) || today() });
    setEditId(payment.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await apiRequest(`/worker-payments/${deleteTarget.id}`, { method: 'DELETE' });
      notify('success', 'تم حذف الدفعة بنجاح.');
      setDeleteTarget(null);
      loadPayments(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const fmtNum = (v) => v != null ? Number(v).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  return (
    <section className="card panel">
      <div className="page-header">
        <h2>💳 مدفوعات العمال</h2>
        <button className="primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(s => !s); }}>
          {showForm ? '✕ إغلاق' : '+ تسجيل دفعة'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <h3>{editId ? '✏️ تعديل الدفعة' : '➕ تسجيل دفعة جديدة'}</h3>
          <form onSubmit={handleSubmit} className="field-grid">
            <label>العامل
              <select required value={form.worker_id} onChange={e => setForm({ ...form, worker_id: e.target.value })}>
                <option value="">اختر العامل</option>
                {workers.filter(w => w.status === 'active').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
            <label>المبلغ (ج.م)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></label>
            <label>تاريخ الدفع<input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
            <label>ملاحظات<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات اختيارية..." /></label>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={formLoading}>{formLoading ? 'جارٍ الحفظ...' : editId ? 'حفظ التعديلات' : 'تسجيل الدفعة'}</button>
              <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Card */}
      {totalAmount > 0 && (
        <div className="summary-bar">
          <span>💰 إجمالي المدفوعات المعروضة:</span>
          <strong className="text-success">{fmtNum(totalAmount)} ج.م</strong>
        </div>
      )}

      {/* Filters */}
      <div className="table-filters">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="table-search" placeholder="ابحث باسم العامل..." value={search} onChange={e => handleSearch(e.target.value)} />
          {search && <button className="clear-search" onClick={() => handleSearch('')}>✕</button>}
        </div>
        <select className="filter-select" value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}>
          <option value="">كل العمال</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <input type="date" className="filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="من تاريخ" />
        <input type="date" className="filter-date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="إلى تاريخ" />
        <button className="secondary" onClick={applyFilters}>تطبيق</button>
        {(workerFilter || dateFrom || dateTo) && <button className="secondary" onClick={clearFilters}>مسح الفلاتر ✕</button>}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="table-loading"><div className="spinner" /><span>جارٍ التحميل...</span></div>
        ) : payments.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">💳</div>
            <p>{search ? `لا توجد نتائج للبحث "${search}"` : 'لا توجد مدفوعات مسجلة بعد'}</p>
            {!search && <button className="primary" onClick={() => setShowForm(true)}>تسجيل أول دفعة</button>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم العامل</th>
                <th>المبلغ المدفوع</th>
                <th>تاريخ الدفع</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id}>
                  <td className="text-muted">{((meta?.current_page || 1) - 1) * 15 + i + 1}</td>
                  <td><strong>{p.worker?.name || '—'}</strong></td>
                  <td className="text-success"><strong>{fmtNum(p.amount)} ج.م</strong></td>
                  <td>{p.payment_date?.slice(0, 10) || '—'}</td>
                  <td className="text-muted">{p.notes || '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action btn-view" title="عرض التفاصيل" onClick={() => setViewPayment(p)}>👁️</button>
                      <button className="btn-action btn-edit" title="تعديل" onClick={() => handleEdit(p)}>✏️</button>
                      <button className="btn-action btn-delete" title="حذف" onClick={() => setDeleteTarget(p)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={meta} onPageChange={p => { setPage(p); loadPayments(p); }} />

      {/* View Modal */}
      {viewPayment && (
        <div className="modal-overlay" onClick={() => setViewPayment(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 تفاصيل الدفعة</h3>
              <button className="modal-close" onClick={() => setViewPayment(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><span>العامل</span><strong>{viewPayment.worker?.name || '—'}</strong></div>
              <div className="detail-item"><span>المبلغ</span><strong className="text-success">{fmtNum(viewPayment.amount)} ج.م</strong></div>
              <div className="detail-item"><span>تاريخ الدفع</span><strong>{viewPayment.payment_date?.slice(0, 10) || '—'}</strong></div>
              <div className="detail-item"><span>ملاحظات</span><strong>{viewPayment.notes || '—'}</strong></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="حذف الدفعة"
        message={`هل تريد حذف دفعة "${deleteTarget?.worker?.name || ''}" بمبلغ ${fmtNum(deleteTarget?.amount)} ج.م؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={formLoading}
      />
    </section>
  );
}
