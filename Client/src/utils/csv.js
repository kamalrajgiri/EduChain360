/**
 * Tiny CSV export utility.
 * Usage:
 *   downloadCSV('transactions.csv', rows, [
 *     { key: 'receipt_number', label: 'Receipt No.' },
 *     { key: 'student_name',   label: 'Student' },
 *   ]);
 */

function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCSV(filename, rows, columns) {
  if (!Array.isArray(rows) || !Array.isArray(columns)) return;

  const header = columns.map((c) => csvEscape(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => csvEscape(row[c.key])).join(','))
    .join('\r\n');

  // U+FEFF BOM helps Excel open UTF-8 correctly
  const csv = `\uFEFF${header}\r\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Timestamp suffix for filenames: 2026-09-20 */
export function todayStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}