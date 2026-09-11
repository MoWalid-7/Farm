// ConfirmModal.jsx — Professional delete confirmation dialog
export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-icon danger">⚠️</div>
        <h3 className="modal-title">{title || 'تأكيد الحذف'}</h3>
        <p className="modal-message">{message || 'هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عنه.'}</p>
        <div className="modal-actions">
          <button className="secondary" onClick={onCancel} disabled={loading}>إلغاء</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'جارٍ الحذف...' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  );
}
