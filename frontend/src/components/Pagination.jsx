// Pagination.jsx — Professional pagination with page info
export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page, last_page, from, to, total } = meta;

  const pages = [];
  const delta = 2;
  const left = current_page - delta;
  const right = current_page + delta;

  for (let i = 1; i <= last_page; i++) {
    if (i === 1 || i === last_page || (i >= left && i <= right)) {
      pages.push(i);
    }
  }

  // Insert ellipsis
  const withEllipsis = [];
  let prev = null;
  for (const page of pages) {
    if (prev && page - prev > 1) withEllipsis.push('...');
    withEllipsis.push(page);
    prev = page;
  }

  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        عرض {from || 0}–{to || 0} من {total || 0} نتيجة
      </span>
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={current_page === 1}
          onClick={() => onPageChange(current_page - 1)}
        >›</button>
        {withEllipsis.map((item, i) =>
          item === '...'
            ? <span key={`e-${i}`} className="page-ellipsis">…</span>
            : <button
                key={item}
                className={`page-btn ${item === current_page ? 'active' : ''}`}
                onClick={() => onPageChange(item)}
              >{item}</button>
        )}
        <button
          className="page-btn"
          disabled={current_page === last_page}
          onClick={() => onPageChange(current_page + 1)}
        >‹</button>
      </div>
    </div>
  );
}
