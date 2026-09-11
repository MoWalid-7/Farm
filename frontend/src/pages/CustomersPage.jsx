import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/Pagination.jsx';

const emptyForm = { name: '', phone: '', address: '' };

export default function CustomersPage({ apiRequest, notify }) {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const debounceRef = useRef(null);

  const loadCustomers = useCallback(async (pageNum = 1, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, per_page: 15 });
      if (q.trim()) params.set('search', q.trim());
      const res = await apiRequest(`/customers?${params}`);
      setCustomers(res.data?.data || []);
      setMeta(res.data?.meta || res.data);
    } catch (e) { notify('error', e.message); }
    finally { setLoading(false); }
  }, [apiRequest, notify, search]);

  useEffect(() => { loadCustomers(page); }, [page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); loadCustomers(1, val); }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editId) {
        await apiRequest(`/customers/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
        notify('success', 'تم تحديث بيانات العميل بنجاح.');
      } else {
        await apiRequest('/customers', { method: 'POST', body: JSON.stringify(form) });
        notify('success', 'تم إضافة العميل بنجاح.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      loadCustomers(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (customer) => {
    setForm({ name: customer.name, phone: customer.phone || '', address: customer.address || '' });
    setEditId(customer.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await apiRequest(`/customers/${deleteTarget.id}`, { method: 'DELETE' });
      notify('success', `تم حذف العميل "${deleteTarget.name}" بنجاح.`);
      setDeleteTarget(null);
      loadCustomers(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const handleView = async (customer) => {
    try {
      const res = await apiRequest(`/customers/${customer.id}`);
      setViewCustomer(res.data);
    } catch (e) { notify('error', e.message); }
  };

  const fmtNum = (v) => v != null ? Number(v).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  const statusBadge = (sale) => {
    const map = { paid: ['badge-success', 'مدفوع'], partially_paid: ['badge-warning', 'جزئي'], unpaid: ['badge-danger', 'غير مدفوع'] };
    const [cls, label] = map[sale.payment_status] || ['badge-muted', 'غير محدد'];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <section className="card panel">
      <div className="page-header">
        <h2>👥 إدارة العملاء</h2>
        <button className="primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(s => !s); }}>
          {showForm ? '✕ إغلاق' : '+ إضافة عميل'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <h3>{editId ? '✏️ تعديل بيانات العميل' : '➕ إضافة عميل جديد'}</h3>
          <form onSubmit={handleSubmit} className="field-grid">
            <label>اسم العميل<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل" /></label>
            <label>رقم الهاتف<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" /></label>
            <label>العنوان<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="العنوان (اختياري)" /></label>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={formLoading}>{formLoading ? 'جارٍ الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة العميل'}</button>
              <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="table-filters">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="table-search" placeholder="ابحث باسم العميل أو رقم الهاتف..." value={search} onChange={e => handleSearch(e.target.value)} />
          {search && <button className="clear-search" onClick={() => handleSearch('')}>✕</button>}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="table-loading"><div className="spinner" /><span>جارٍ التحميل...</span></div>
        ) : customers.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">👥</div>
            <p>{search ? `لا توجد نتائج للبحث "${search}"` : 'لا يوجد عملاء مسجلون بعد'}</p>
            {!search && <button className="primary" onClick={() => setShowForm(true)}>إضافة أول عميل</button>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم العميل</th>
                <th>الهاتف</th>
                <th>عدد المبيعات</th>
                <th>إجمالي المبيعات</th>
                <th>إجمالي المدفوع</th>
                <th>الرصيد المتبقي</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => {
                const remaining = Number(c.sales_sum_remaining_amount || 0);
                return (
                  <tr key={c.id}>
                    <td className="text-muted">{((meta?.current_page || 1) - 1) * 15 + i + 1}</td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.phone || '—'}</td>
                    <td><span className="badge badge-info">{c.sales_count || 0} فاتورة</span></td>
                    <td>{fmtNum(c.sales_sum_total_amount)} ج.م</td>
                    <td className="text-success">{fmtNum(c.sales_sum_paid_amount)} ج.م</td>
                    <td>
                      <span className={remaining > 0 ? 'text-danger' : 'text-success'}>
                        <strong>{fmtNum(remaining)} ج.م</strong>
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-action btn-view" title="عرض التفاصيل" onClick={() => handleView(c)}>👁️</button>
                        <button className="btn-action btn-edit" title="تعديل" onClick={() => handleEdit(c)}>✏️</button>
                        <button className="btn-action btn-delete" title="حذف" onClick={() => setDeleteTarget(c)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={meta} onPageChange={p => { setPage(p); loadCustomers(p); }} />

      {/* View Modal */}
      {viewCustomer && (
        <div className="modal-overlay" onClick={() => setViewCustomer(null)}>
          <div className="modal-box modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 {viewCustomer.name}</h3>
              <button className="modal-close" onClick={() => setViewCustomer(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><span>الهاتف</span><strong>{viewCustomer.phone || '—'}</strong></div>
              <div className="detail-item"><span>العنوان</span><strong>{viewCustomer.address || '—'}</strong></div>
              <div className="detail-item"><span>إجمالي المبيعات</span><strong>{fmtNum(viewCustomer.sales_sum_total_amount)} ج.م</strong></div>
              <div className="detail-item"><span>إجمالي المدفوع</span><strong className="text-success">{fmtNum(viewCustomer.sales_sum_paid_amount)} ج.م</strong></div>
              <div className="detail-item"><span>الرصيد المتبقي</span>
                <strong className={Number(viewCustomer.sales_sum_remaining_amount) > 0 ? 'text-danger' : 'text-success'}>
                  {fmtNum(viewCustomer.sales_sum_remaining_amount)} ج.م
                </strong>
              </div>
            </div>
            {viewCustomer.sales?.length > 0 && (
              <>
                <h4 style={{ margin: '20px 0 10px', fontWeight: 800 }}>سجل المبيعات</h4>
                <div className="table-wrap" style={{ marginTop: 0 }}>
                  <table>
                    <thead>
                      <tr><th>#</th><th>التاريخ</th><th>الوزن (كجم)</th><th>السعر</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th></tr>
                    </thead>
                    <tbody>
                      {viewCustomer.sales.map((s, idx) => (
                        <tr key={s.id}>
                          <td className="text-muted">{idx + 1}</td>
                          <td>{s.sale_date?.slice(0, 10) || '—'}</td>
                          <td>{fmtNum(s.weight)} كجم</td>
                          <td>{fmtNum(s.price)} ج.م</td>
                          <td><strong>{fmtNum(s.total_amount)} ج.م</strong></td>
                          <td className="text-success">{fmtNum(s.paid_amount)} ج.م</td>
                          <td className={Number(s.remaining_amount) > 0 ? 'text-danger' : 'text-success'}>{fmtNum(s.remaining_amount)} ج.م</td>
                          <td>{statusBadge(s)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {(!viewCustomer.sales || viewCustomer.sales.length === 0) && (
              <div className="table-empty" style={{ margin: '16px 0 0' }}><p>لا توجد مبيعات مسجلة لهذا العميل</p></div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="حذف العميل"
        message={`هل تريد حذف العميل "${deleteTarget?.name}"؟ لا يمكن حذف عميل لديه مبيعات مرتبطة.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={formLoading}
      />
    </section>
  );
}
