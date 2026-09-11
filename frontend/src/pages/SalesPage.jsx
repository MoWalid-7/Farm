import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/Pagination.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { customer_id: '', cycle_id: '', quantity: '', weight: '', price: '', paid_amount: '', date: today() };

const STATUS_LABELS = {
  paid: { label: 'مدفوع', cls: 'badge-success' },
  partially_paid: { label: 'جزئي', cls: 'badge-warning' },
  unpaid: { label: 'غير مدفوع', cls: 'badge-danger' },
};

export default function SalesPage({ apiRequest, notify, customers, cycles }) {
  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewSale, setViewSale] = useState(null);
  const debounceRef = useRef(null);

  // Live total calculation
  const liveTotal = form.weight && form.price ? (parseFloat(form.weight) * parseFloat(form.price)).toFixed(2) : null;
  const liveRemaining = liveTotal && form.paid_amount !== '' ? Math.max(0, parseFloat(liveTotal) - parseFloat(form.paid_amount || 0)).toFixed(2) : null;

  const buildParams = (pageNum, q, cf, sf, df, dt) => {
    const p = new URLSearchParams({ page: pageNum, per_page: 15 });
    if (q?.trim()) p.set('search', q.trim());
    if (cf) p.set('customer_id', cf);
    if (sf) p.set('status', sf);
    if (df) p.set('date_from', df);
    if (dt) p.set('date_to', dt);
    return p;
  };

  const loadSales = useCallback(async (pageNum = 1, q = search, cf = customerFilter, sf = statusFilter, df = dateFrom, dt = dateTo) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/sales?${buildParams(pageNum, q, cf, sf, df, dt)}`);
      setSales(res.data?.data || []);
      setMeta(res.data?.meta || res.data);
    } catch (e) { notify('error', e.message); }
    finally { setLoading(false); }
  }, [apiRequest, notify, search, customerFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => { loadSales(page); }, [page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); loadSales(1, val, customerFilter, statusFilter, dateFrom, dateTo); }, 400);
  };

  const applyFilters = () => { setPage(1); loadSales(1, search, customerFilter, statusFilter, dateFrom, dateTo); };
  const clearFilters = () => { setSearch(''); setCustomerFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1); loadSales(1, '', '', '', '', ''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { notify('error', 'يجب اختيار عميل.'); return; }
    if (!form.weight || !form.price) { notify('error', 'الوزن والسعر مطلوبان.'); return; }
    const paidAmt = parseFloat(form.paid_amount || 0);
    const total = parseFloat(form.weight) * parseFloat(form.price);
    if (paidAmt > total) { notify('error', 'المبلغ المدفوع لا يمكن أن يتجاوز إجمالي قيمة البيع.'); return; }

    setFormLoading(true);
    try {
      const payload = {
        customer_id: form.customer_id,
        cycle_id: form.cycle_id || null,
        quantity: Number(form.quantity || 1),
        weight: Number(form.weight),
        price: Number(form.price),
        paid_amount: paidAmt,
        sale_date: form.date,
      };
      if (editId) {
        await apiRequest(`/sales/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('success', 'تم تحديث عملية البيع بنجاح.');
      } else {
        await apiRequest('/sales', { method: 'POST', body: JSON.stringify(payload) });
        notify('success', 'تم تسجيل عملية البيع بنجاح.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      loadSales(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (sale) => {
    setForm({
      customer_id: sale.customer_id || sale.customer?.id || '',
      cycle_id: sale.cycle_id || '',
      quantity: sale.quantity || '',
      weight: sale.weight || '',
      price: sale.price || '',
      paid_amount: sale.paid_amount || '',
      date: sale.sale_date?.slice(0, 10) || today(),
    });
    setEditId(sale.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await apiRequest(`/sales/${deleteTarget.id}`, { method: 'DELETE' });
      notify('success', 'تم حذف عملية البيع بنجاح.');
      setDeleteTarget(null);
      loadSales(page);
    } catch (e) { notify('error', e.message); }
    finally { setFormLoading(false); }
  };

  const fmtNum = (v) => v != null ? Number(v).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  return (
    <section className="card panel">
      <div className="page-header">
        <h2>🛒 إدارة المبيعات</h2>
        <button className="primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(s => !s); }}>
          {showForm ? '✕ إغلاق' : '+ إضافة بيع'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-section">
          <h3>{editId ? '✏️ تعديل عملية البيع' : '➕ إضافة عملية بيع جديدة'}</h3>

          {/* Live Calculator */}
          {liveTotal && (
            <div className="sale-calculator">
              <div className="calc-item">
                <span>الوزن × السعر</span>
                <strong>{fmtNum(liveTotal)} ج.م</strong>
              </div>
              <div className="calc-item">
                <span>المدفوع</span>
                <strong className="text-success">{fmtNum(form.paid_amount || 0)} ج.م</strong>
              </div>
              {liveRemaining !== null && (
                <div className="calc-item">
                  <span>المتبقي</span>
                  <strong className={parseFloat(liveRemaining) > 0 ? 'text-danger' : 'text-success'}>{fmtNum(liveRemaining)} ج.م</strong>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="field-grid">
            <label>العميل
              <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">اختر العميل</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>الدورة (اختياري)
              <select value={form.cycle_id} onChange={e => setForm({ ...form, cycle_id: e.target.value })}>
                <option value="">بدون دورة</option>
                {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>الوزن (كجم)<input required type="number" min="0.001" step="0.001" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="مثال: 50.000" /></label>
            <label>سعر الكيلو (ج.م)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="مثال: 100.00" /></label>
            <label>المبلغ المدفوع (ج.م)<input type="number" min="0" step="0.01" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} placeholder="0.00 = غير مدفوع" /></label>
            <label>العدد (للعلم فقط)<input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="اختياري" /></label>
            <label>تاريخ البيع<input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={formLoading}>{formLoading ? 'جارٍ الحفظ...' : editId ? 'حفظ التعديلات' : 'تسجيل البيع'}</button>
              <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="table-filters">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="table-search" placeholder="ابحث برقم الفاتورة أو اسم العميل..." value={search} onChange={e => handleSearch(e.target.value)} />
          {search && <button className="clear-search" onClick={() => handleSearch('')}>✕</button>}
        </div>
        <select className="filter-select" value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}>
          <option value="">كل العملاء</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="paid">مدفوع</option>
          <option value="partially_paid">جزئي</option>
          <option value="unpaid">غير مدفوع</option>
        </select>
        <input type="date" className="filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="من تاريخ" />
        <input type="date" className="filter-date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="إلى تاريخ" />
        <button className="secondary" onClick={applyFilters}>تطبيق</button>
        {(customerFilter || statusFilter || dateFrom || dateTo) && <button className="secondary" onClick={clearFilters}>مسح ✕</button>}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="table-loading"><div className="spinner" /><span>جارٍ التحميل...</span></div>
        ) : sales.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">🛒</div>
            <p>{search ? `لا توجد نتائج للبحث "${search}"` : 'لا توجد مبيعات مسجلة بعد'}</p>
            {!search && <button className="primary" onClick={() => setShowForm(true)}>تسجيل أول عملية بيع</button>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>الوزن (كجم)</th>
                <th>سعر الكيلو</th>
                <th>الإجمالي</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => {
                const { label, cls } = STATUS_LABELS[s.payment_status] || { label: '—', cls: 'badge-muted' };
                return (
                  <tr key={s.id}>
                    <td><span className="invoice-num">#{s.id}</span></td>
                    <td><strong>{s.customer?.name || '—'}</strong></td>
                    <td>{s.sale_date?.slice(0, 10) || '—'}</td>
                    <td>{fmtNum(s.weight)} كجم</td>
                    <td>{fmtNum(s.price)} ج.م</td>
                    <td><strong>{fmtNum(s.total_amount)} ج.م</strong></td>
                    <td className="text-success">{fmtNum(s.paid_amount)} ج.م</td>
                    <td className={Number(s.remaining_amount) > 0 ? 'text-danger' : 'text-success'}><strong>{fmtNum(s.remaining_amount)} ج.م</strong></td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-action btn-view" title="عرض التفاصيل" onClick={() => setViewSale(s)}>👁️</button>
                        <button className="btn-action btn-edit" title="تعديل" onClick={() => handleEdit(s)}>✏️</button>
                        <button className="btn-action btn-delete" title="حذف" onClick={() => setDeleteTarget(s)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={meta} onPageChange={p => { setPage(p); loadSales(p); }} />

      {/* View Modal */}
      {viewSale && (
        <div className="modal-overlay" onClick={() => setViewSale(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🛒 فاتورة رقم #{viewSale.id}</h3>
              <button className="modal-close" onClick={() => setViewSale(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><span>العميل</span><strong>{viewSale.customer?.name || '—'}</strong></div>
              <div className="detail-item"><span>التاريخ</span><strong>{viewSale.sale_date?.slice(0, 10) || '—'}</strong></div>
              <div className="detail-item"><span>الدورة</span><strong>{viewSale.cycle?.name || '—'}</strong></div>
              <div className="detail-item"><span>الوزن</span><strong>{fmtNum(viewSale.weight)} كجم</strong></div>
              <div className="detail-item"><span>سعر الكيلو</span><strong>{fmtNum(viewSale.price)} ج.م</strong></div>
              <div className="detail-item"><span>الإجمالي</span><strong style={{fontSize:'1.2rem'}}>{fmtNum(viewSale.total_amount)} ج.م</strong></div>
              <div className="detail-item"><span>المدفوع</span><strong className="text-success">{fmtNum(viewSale.paid_amount)} ج.م</strong></div>
              <div className="detail-item"><span>المتبقي</span><strong className={Number(viewSale.remaining_amount) > 0 ? 'text-danger' : 'text-success'}>{fmtNum(viewSale.remaining_amount)} ج.م</strong></div>
              <div className="detail-item"><span>الحالة</span><span className={`badge ${(STATUS_LABELS[viewSale.payment_status] || {}).cls || 'badge-muted'}`}>{(STATUS_LABELS[viewSale.payment_status] || {}).label || '—'}</span></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="حذف عملية البيع"
        message={`هل تريد حذف فاتورة رقم #${deleteTarget?.id} الخاصة بـ "${deleteTarget?.customer?.name}"؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={formLoading}
      />
    </section>
  );
}
