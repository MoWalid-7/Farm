import { useCallback, useEffect, useState } from 'react';
import CustomersPage from './pages/CustomersPage.jsx';
import SalesPage from './pages/SalesPage.jsx';
import WorkersPage from './pages/WorkersPage.jsx';
import WorkerPaymentsPage from './pages/WorkerPaymentsPage.jsx';
import CyclesPage from './pages/CyclesPage.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://backend.test/api/v1';
const emptySettings = {
  farm_name: 'نظام إدارة المزرعة',
  farm_information: 'إدارة دورة المزرعة، العمال، المصروفات والإيرادات.',
  currency: 'EGP',
  backup_enabled: true,
  backup_frequency: 'weekly',
};

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('farm_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errors = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    throw new Error(errors || data.message || 'حدث خطأ غير متوقع.');
  }
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('farm_token') || '');
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(emptySettings);
  const [summary, setSummary] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [report, setReport] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [reportDate, setReportDate] = useState(today());
  const [backups, setBackups] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState({ type: 'info', message: '' });
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: 'owner@farm.test', password: 'secret123' });
  const [moneyForm, setMoneyForm] = useState({ type: 'expense', amount: '', category: '', description: '', date: today() });
  const [weightForm, setWeightForm] = useState({ cycle_id: '', bird_count: '', total_weight: '', date: today() });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [itemForm, setItemForm] = useState({ supplier_id: '', name: '', sku: '', unit: 'كجم', minimum_stock: '', description: '' });
  const [stockForm, setStockForm] = useState({ inventory_item_id: '', type: 'purchase', quantity: '', notes: '', date: today() });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportType, setReportType] = useState('financial');
  const [operationsLog, setOperationsLog] = useState([]);

  // PWA State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateWorker, setUpdateWorker] = useState(null);

  // Status auto-clear
  useEffect(() => {
    if (status.message) {
      const t = setTimeout(() => setStatus({ type: 'info', message: '' }), 4000);
      return () => clearTimeout(t);
    }
  }, [status]);

  // PWA Event Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (localStorage.getItem('farm_pwa_dismissed') !== 'true') setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const handleUpdateAvailable = (e) => setUpdateWorker(e.detail.worker);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  };
  const dismissInstall = () => { setShowInstallBanner(false); localStorage.setItem('farm_pwa_dismissed', 'true'); };
  const applyUpdate = () => { if (updateWorker) { updateWorker.postMessage({ type: 'SKIP_WAITING' }); window.location.reload(); } };

  const notify = (type, message) => setStatus({ type, message });

  const loadDashboard = useCallback(async () => {
    const [dashboard, workerResponse, cycleResponse, customerResponse, supplierResponse, itemResponse, lowStockResponse, notificationResponse, backupResponse] = await Promise.all([
      apiRequest('/dashboard/summary'),
      apiRequest('/workers?per_page=100'),
      apiRequest('/cycles?per_page=100'),
      apiRequest('/customers?per_page=100'),
      apiRequest('/suppliers'),
      apiRequest('/inventory-items'),
      apiRequest('/inventory-items/low-stock'),
      apiRequest('/notifications'),
      apiRequest('/backups'),
    ]);
    setSummary(dashboard.data);
    setWorkers(workerResponse.data?.data || []);
    setCycles(cycleResponse.data?.data || []);
    setCustomers(customerResponse.data?.data || []);
    setSuppliers(supplierResponse.data?.data || []);
    setInventoryItems(itemResponse.data?.data || []);
    setLowStockItems(lowStockResponse.data || []);
    setNotifications(notificationResponse.data || []);
    setBackups(backupResponse.data?.data || []);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try { await apiRequest('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    }
    localStorage.removeItem('farm_token');
    setToken(''); setUser(null);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    Promise.all([apiRequest('/auth/me'), apiRequest('/settings')])
      .then(([profile, setting]) => {
        setUser(profile.data);
        setSettings({ ...emptySettings, ...setting.data });
        return loadDashboard();
      })
      .catch((error) => { notify('error', error.message); logout(); });
  }, [token, loadDashboard, logout]);

  const handleLogin = async (event) => {
    event.preventDefault(); setLoading(true);
    try {
      const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(loginForm) });
      localStorage.setItem('farm_token', result.data.token);
      setToken(result.data.token);
      notify('success', 'تم تسجيل الدخول بنجاح.');
    } catch (error) { notify('error', error.message); }
    finally { setLoading(false); }
  };

  const search = async (event) => {
    event.preventDefault();
    if (searchQuery.trim().length < 2) return;
    try {
      const result = await apiRequest(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(result.data || []);
    } catch (error) { notify('error', error.message); }
  };

  const loadReport = async (event) => {
    event.preventDefault();
    try {
      if (reportType === 'financial') {
        const result = await apiRequest(`/reports/financial/${reportPeriod}?from=${reportDate}&to=${reportDate}`);
        setReport(result.data);
      } else {
        const result = await apiRequest(`/activity-logs?from=${reportDate}&to=${reportDate}`);
        setOperationsLog(result.data?.data || result.data || []);
      }
    } catch (error) { notify('error', error.message); }
  };

  const createBackup = async () => {
    try { await apiRequest('/backups', { method: 'POST' }); await loadDashboard(); notify('success', 'تم إنشاء النسخة الاحتياطية.'); }
    catch (error) { notify('error', error.message); }
  };

  const downloadBackup = async (backup) => {
    const response = await fetch(`${API_BASE}/backups/${backup.id}/download`, { headers: { Authorization: `Bearer ${localStorage.getItem('farm_token')}` } });
    if (!response.ok) { notify('error', 'تعذر تنزيل النسخة الاحتياطية.'); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = backup.filename; link.click(); URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    let htmlContent = `<html xmlns:x="urn:schemas-microsoft-com:office:excel" dir="rtl"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Tahoma}th,td{border:1px solid #ddd;padding:10px;text-align:center}th{background:#1e3a8a;color:#fff}</style></head><body>`;
    if (reportType === 'financial' && report) {
      htmlContent += `<table><tr><td colspan="2" style="font-weight:bold;font-size:18px">الملخص المالي - ${reportDate}</td></tr><tr><th>البيان</th><th>القيمة (ج.م)</th></tr><tr><td>إجمالي الإيرادات</td><td>${report.summary.total_revenues}</td></tr><tr><td>إجمالي المصروفات</td><td>${report.summary.total_expenses}</td></tr><tr><td>صافي الربح</td><td>${report.summary.net_profit}</td></tr></table><br>`;
      report.breakdown.forEach(row => { htmlContent += `<tr><td>${row.label}</td><td>${row.summary.total_revenues}</td><td>${row.summary.net_profit}</td></tr>`; });
      htmlContent += `</table>`;
    } else if (reportType === 'operations' && operationsLog.length > 0) {
      htmlContent += `<table><tr><td colspan="3" style="font-weight:bold">سجل العمليات - ${reportDate}</td></tr><tr><th>التاريخ</th><th>العملية</th><th>التفاصيل</th></tr>`;
      operationsLog.forEach(log => { htmlContent += `<tr><td>${new Date(log.created_at).toLocaleString('ar-EG')}</td><td>${log.description || log.event}</td><td>${JSON.stringify(log.properties)}</td></tr>`; });
      htmlContent += `</table>`;
    }
    htmlContent += `</body></html>`;
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `report-${reportDate}.xls`; link.click(); URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const createMoneyRecord = async (event) => {
    event.preventDefault(); setLoading(true);
    const isExpense = moneyForm.type === 'expense';
    const payload = { amount: moneyForm.amount, description: moneyForm.description, ...(isExpense ? { category: moneyForm.category, expense_date: moneyForm.date } : { source: moneyForm.category, revenue_date: moneyForm.date }) };
    try {
      await apiRequest(isExpense ? '/expenses' : '/revenues', { method: 'POST', body: JSON.stringify(payload) });
      setMoneyForm({ ...moneyForm, amount: '', category: '', description: '' });
      await loadDashboard();
      notify('success', isExpense ? 'تم تسجيل المصروف.' : 'تم تسجيل الإيراد.');
    } catch (error) { notify('error', error.message); }
    finally { setLoading(false); }
  };

  const createResource = async (event, path, body, reset) => {
    event.preventDefault(); setLoading(true);
    try { await apiRequest(path, { method: 'POST', body: JSON.stringify(body) }); reset(); await loadDashboard(); notify('success', 'تم الحفظ بنجاح.'); }
    catch (error) { notify('error', error.message); }
    finally { setLoading(false); }
  };

  const saveSettings = async (event) => {
    event.preventDefault(); setLoading(true);
    try { const result = await apiRequest('/settings', { method: 'PUT', body: JSON.stringify(settings) }); setSettings(result.data); notify('success', 'تم حفظ الإعدادات.'); }
    catch (error) { notify('error', error.message); }
    finally { setLoading(false); }
  };

  if (!token) {
    return <div className="auth-layout"><div className="auth-card">
      <div className="auth-header"><span className="brand-pill">Farm Pro</span><h1>نظام إدارة المزرعة</h1><p>لوحة تشغيل عربية لإدارة المزرعة.</p></div>
      <form onSubmit={handleLogin} className="login-form">
        <label>البريد الإلكتروني<input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} /></label>
        <label>كلمة المرور<input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} /></label>
        <button type="submit" disabled={loading}>{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</button>
      </form>
      {status.message && <div className={`status ${status.type}`}>{status.message}</div>}
    </div></div>;
  }

  const tabs = [
    ['dashboard', '🏠', 'الرئيسية'],
    ['workers', '👷', 'العمال'],
    ['payments', '💳', 'مدفوعات العمال'],
    ['customers', '👥', 'العملاء'],
    ['sales', '🛒', 'المبيعات'],
    ['operations', '🔄', 'الدورات'],
    ['money', '💰', 'المالية'],
    ['inventory', '📦', 'المخزون'],
    ['reports', '📊', 'التقارير'],
    ['backups', '💾', 'النسخ الاحتياطي'],
    ['activity', '🔔', 'النشاط والتنبيهات'],
    ['settings', '⚙️', 'الإعدادات'],
  ];

  const fmt = (value) => typeof value === 'number' ? `${value.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م` : '...';
  const fmtNum = (v) => v != null ? Number(v).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  return <div className="app-shell">
    {/* ===== PWA BANNERS ===== */}
    {isOffline && (<div className="pwa-banner offline"><span className="banner-icon">📶❌</span>أنت تتصفح بدون إنترنت (Offline Mode)</div>)}
    {updateWorker && (<div className="pwa-banner update"><div><strong>تحديث جديد!</strong> يتوفر إصدار أحدث من النظام.</div><button className="primary small" onClick={applyUpdate}>تحديث الآن</button></div>)}
    {showInstallBanner && installPrompt && (<div className="pwa-banner install"><div><strong>تثبيت التطبيق</strong> لتجربة أسرع ووصول بدون إنترنت.</div><div className="banner-actions"><button className="primary small" onClick={handleInstallClick}>تثبيت</button><button className="secondary small" onClick={dismissInstall}>لاحقاً</button></div></div>)}

    {/* ===== MOBILE NAVBAR ===== */}
    <nav className="mobile-navbar">
      <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
      <div className="mobile-title"><span className="logo-icon">🌾</span>{settings.farm_name}</div>
    </nav>

    {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

    {/* ===== SIDEBAR ===== */}
    <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-brand">
          <div className="sidebar-icon">🌾</div>
          <div><div className="sidebar-title">{settings.farm_name}</div><div className="sidebar-subtitle">Farm Pro</div></div>
        </div>
      </div>
      <nav className="sidebar-nav tabs">
        <div className="sidebar-section-label">القائمة الرئيسية</div>
        {tabs.map(([id, emoji, label]) => (
          <button key={id} className={activeTab === id ? 'tab active' : 'tab'} onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}>
            <span className="tab-emoji">{emoji}</span>{label}
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <span className="user-email">{user?.email}</span>
          <button className="logout-btn" onClick={logout}>خروج</button>
        </div>
      </div>
    </aside>

    {/* ===== MAIN ===== */}
    <main className="dashboard">
      {/* Global search bar (for activity tab) */}
      {activeTab === 'activity' && (
        <form className="search-bar" onSubmit={search}>
          <input minLength="2" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث في العمال والعملاء والمخزون..." />
          <button className="primary">بحث</button>
        </form>
      )}

      {/* Status toast */}
      {status.message && <div className={`status ${status.type}`}>{status.message}</div>}

      {/* ===== DASHBOARD ===== */}
      {activeTab === 'dashboard' && (
        <>
          <section className="stats-grid">
            {[
              ['إجمالي الإيرادات', summary?.total_revenues],
              ['إجمالي المصروفات', summary?.total_expenses],
              ['مدفوعات العمال', summary?.total_worker_payments],
              ['صافي الربح', summary?.net_profit],
              ['العمال النشطون', summary?.active_workers],
            ].map(([label, value]) => <div className="card stat" key={label}><span>{label}</span><strong>{fmt(value)}</strong></div>)}
          </section>
          <section className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
            <div className="card panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ إجراءات سريعة</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' }}>
                <button className="primary" onClick={() => setActiveTab('money')}>💰 تسجيل مصروف/إيراد</button>
                <button className="primary" style={{ background: '#3b82f6' }} onClick={() => setActiveTab('sales')}>🛒 إضافة بيعة جديدة</button>
                <button className="secondary" onClick={() => setActiveTab('workers')}>👷 تسجيل عامل جديد</button>
                <button className="secondary" onClick={() => setActiveTab('inventory')}>📦 إضافة للمخزون</button>
              </div>
            </div>
            <div className="card panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🔔 تنبيهات النظام</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171' }}>
                  <strong>⚠️ انخفاض المخزون:</strong> يوجد {lowStockItems.length} أصناف في المخزن قاربت على النفاد.
                </li>
                <li style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#60a5fa' }}>
                  <strong>ℹ️ الدورات النشطة:</strong> {cycles.filter(c => c.status === 'active').length} دورة نشطة حالياً.
                </li>
                <li style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#4ade80' }}>
                  <strong>✅ النظام يعمل بكفاءة:</strong> {customers.length} عميل مسجل، {workers.filter(w => w.status === 'active').length} عامل نشط.
                </li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* ===== WORKERS PAGE (new component) ===== */}
      {activeTab === 'workers' && (
        <WorkersPage apiRequest={apiRequest} notify={notify} fmt={fmt} />
      )}

      {/* ===== WORKER PAYMENTS PAGE (new component) ===== */}
      {activeTab === 'payments' && (
        <WorkerPaymentsPage apiRequest={apiRequest} notify={notify} workers={workers} />
      )}

      {/* ===== CUSTOMERS PAGE (new component) ===== */}
      {activeTab === 'customers' && (
        <CustomersPage apiRequest={apiRequest} notify={notify} />
      )}

      {/* ===== SALES PAGE (new component) ===== */}
      {activeTab === 'sales' && (
        <SalesPage apiRequest={apiRequest} notify={notify} customers={customers} cycles={cycles} />
      )}

      {/* ===== CYCLES PAGE (new component) ===== */}
      {activeTab === 'operations' && (
        <CyclesPage apiRequest={apiRequest} notify={notify} />
      )}

      {/* ===== MONEY ===== */}
      {activeTab === 'money' && <section className="card panel"><h2>تسجيل حركة مالية</h2><form onSubmit={createMoneyRecord} className="field-grid">
        <label>النوع<select value={moneyForm.type} onChange={(e) => setMoneyForm({ ...moneyForm, type: e.target.value })}><option value="expense">مصروف</option><option value="revenue">إيراد</option></select></label>
        <label>المبلغ<input required type="number" min="0.01" step="0.01" value={moneyForm.amount} onChange={(e) => setMoneyForm({ ...moneyForm, amount: e.target.value })} /></label>
        <label>{moneyForm.type === 'expense' ? 'التصنيف' : 'المصدر'}<input required value={moneyForm.category} onChange={(e) => setMoneyForm({ ...moneyForm, category: e.target.value })} /></label>
        <label>التاريخ<input type="date" required value={moneyForm.date} onChange={(e) => setMoneyForm({ ...moneyForm, date: e.target.value })} /></label>
        <label>الوصف<textarea value={moneyForm.description} onChange={(e) => setMoneyForm({ ...moneyForm, description: e.target.value })} /></label>
        <button className="primary" disabled={loading}>حفظ الحركة</button>
      </form></section>}

      {/* ===== INVENTORY ===== */}
      {activeTab === 'inventory' && <section className="card panel"><h2>إضافة مورد</h2><form onSubmit={(event) => createResource(event, '/suppliers', supplierForm, () => setSupplierForm({ name: '', phone: '', email: '', address: '' }))} className="field-grid">
        <label>اسم المورد<input required value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /></label>
        <label>الهاتف<input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></label>
        <label>البريد الإلكتروني<input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} /></label>
        <button className="primary" disabled={loading}>حفظ المورد</button>
      </form><h2>إضافة صنف مخزون</h2><form onSubmit={(event) => createResource(event, '/inventory-items', { ...itemForm, supplier_id: itemForm.supplier_id || null, minimum_stock: Number(itemForm.minimum_stock || 0) }, () => setItemForm({ ...itemForm, name: '', sku: '', minimum_stock: '' }))} className="field-grid">
        <label>اسم الصنف<input required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></label>
        <label>المورد<select value={itemForm.supplier_id} onChange={(e) => setItemForm({ ...itemForm, supplier_id: e.target.value })}><option value="">بدون مورد</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
        <label>الوحدة<input required value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} /></label>
        <label>حد التنبيه<input type="number" min="0" step="0.01" value={itemForm.minimum_stock} onChange={(e) => setItemForm({ ...itemForm, minimum_stock: e.target.value })} /></label>
        <button className="primary" disabled={loading}>حفظ الصنف</button>
      </form><h2>حركة مخزون</h2><form onSubmit={(event) => createResource(event, '/inventory-transactions', { inventory_item_id: stockForm.inventory_item_id, type: stockForm.type, quantity: Number(stockForm.quantity), notes: stockForm.notes, transaction_date: stockForm.date }, () => setStockForm({ ...stockForm, quantity: '', notes: '' }))} className="field-grid">
        <label>الصنف<select required value={stockForm.inventory_item_id} onChange={(e) => setStockForm({ ...stockForm, inventory_item_id: e.target.value })}><option value="">اختر الصنف</option>{inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.current_quantity ?? 0})</option>)}</select></label>
        <label>نوع الحركة<select value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}><option value="purchase">شراء / إضافة</option><option value="usage">استخدام</option><option value="waste">هالك</option><option value="return">مرتجع</option></select></label>
        <label>الكمية<input type="number" min="0.01" step="0.01" required value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} /></label>
        <button className="primary" disabled={loading}>حفظ الحركة</button>
      </form><div className="status info">أصناف تحتاج إعادة طلب: {lowStockItems.length}</div></section>}

      {/* ===== REPORTS ===== */}
      {activeTab === 'reports' && <section className="card panel">
        <h2>التقارير وسجل العمليات</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button className={reportType === 'financial' ? 'primary' : 'secondary'} onClick={() => { setReportType('financial'); setReport(null); }}>تقرير مالي</button>
          <button className={reportType === 'operations' ? 'primary' : 'secondary'} onClick={() => { setReportType('operations'); setOperationsLog([]); }}>تقرير العمليات</button>
        </div>
        <form className="field-grid" onSubmit={loadReport}>
          {reportType === 'financial' && (<label>الفترة<select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}><option value="daily">يومي</option><option value="weekly">أسبوعي</option><option value="monthly">شهري</option><option value="custom">مخصص</option></select></label>)}
          <label>التاريخ المرجعي<input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} /></label>
          <button className="primary">عرض التقرير</button>
        </form>
        {reportType === 'financial' && report && <>
          <div className="action-row no-print">
            <button type="button" className="secondary" onClick={exportExcel}>تصدير إكسيل (Excel)</button>
            <button type="button" className="secondary" onClick={handlePrint}>طباعة التقرير</button>
          </div>
          <div className="stats-grid report-summary print-content">
            {Object.entries(report.summary).filter(([key]) => key !== 'active_workers').map(([key, value]) => <div className="card stat" key={key}><span>{key}</span><strong>{fmt(Number(value))}</strong></div>)}
          </div>
          <h2 className="print-content">التفاصيل</h2>
          <div className="table-wrap print-content">
            <table><tbody>{report.breakdown.map((row) => <tr key={`${row.from}-${row.to}`}><td>{row.label}</td><td>{fmt(Number(row.summary.total_revenues))}</td><td>{fmt(Number(row.summary.net_profit))}</td></tr>)}</tbody></table>
          </div>
        </>}
        {reportType === 'operations' && operationsLog.length > 0 && <>
          <div className="action-row no-print">
            <button type="button" className="secondary" onClick={exportExcel}>تصدير إكسيل (Excel)</button>
            <button type="button" className="secondary" onClick={handlePrint}>طباعة التقرير</button>
          </div>
          <div className="table-wrap print-content">
            <table><thead><tr><th>التاريخ</th><th>العملية</th><th>التفاصيل</th></tr></thead><tbody>
              {operationsLog.map((log) => (<tr key={log.id}><td>{new Date(log.created_at).toLocaleString('ar-EG')}</td><td>{log.description || log.event}</td><td style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{JSON.stringify(log.properties)}</td></tr>))}
            </tbody></table>
          </div>
        </>}
      </section>}

      {/* ===== BACKUPS ===== */}
      {activeTab === 'backups' && <section className="card panel"><h2>النسخ الاحتياطية</h2><button className="primary" onClick={createBackup}>إنشاء نسخة الآن</button><div className="activity-list">{backups.map((backup) => <div className="activity-item" key={backup.id}><span>{backup.filename}</span><button className="secondary" onClick={() => downloadBackup(backup)}>تنزيل</button></div>)}</div></section>}

      {/* ===== ACTIVITY ===== */}
      {activeTab === 'activity' && <section className="card panel"><h2>نتائج البحث</h2>{searchResults.length ? <div className="activity-list">{searchResults.map((result, index) => <div className="activity-item" key={`${result.type}-${result.id}-${index}`}><strong>{result.label || result.name || result.title}</strong><span>{result.type}</span></div>)}</div> : <p>استخدم البحث للوصول السريع إلى سجلات النظام.</p>}<h2>التنبيهات الحالية ({notifications.length})</h2><div className="activity-list">{notifications.map((notification) => <div className="activity-item" key={notification.id}><strong>{notification.title}</strong><span>{notification.message}</span></div>)}</div></section>}

      {/* ===== SETTINGS ===== */}
      {activeTab === 'settings' && <section className="card panel"><h2>إعدادات المزرعة</h2><form onSubmit={saveSettings} className="settings-form">
        <label>اسم المزرعة<input value={settings.farm_name} onChange={(e) => setSettings({ ...settings, farm_name: e.target.value })} /></label>
        <label>المعلومات<textarea value={settings.farm_information || ''} onChange={(e) => setSettings({ ...settings, farm_information: e.target.value })} /></label>
        <label>العملة<select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}><option value="EGP">جنيه مصري (ج.م)</option><option value="SAR">ريال سعودي (SAR)</option><option value="USD">دولار أمريكي (USD)</option></select></label>
        <button className="primary" disabled={loading}>حفظ الإعدادات</button>
      </form></section>}
    </main>
  </div>;
}
