/**
 * CSV parsing utilities for bookings import
 */

export interface TabularRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface TabularDataset {
  headers: string[];
  rows: TabularRow[];
}

/**
 * Parse CSV content into a 2D array of strings
 * Handles quoted fields and escaped quotes
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        const next = content[i + 1];
        if (next === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((item) => item.some((cell) => cell.trim().length > 0));
}

/**
 * Build a structured dataset from raw CSV rows
 */
export function buildTabularDataset(rows: string[][]): TabularDataset {
  if (rows.length === 0) {
    throw new Error("No rows found in file");
  }

  const headers = rows[0].map((header) => header.trim());
  if (!headers.some((header) => header.length > 0)) {
    throw new Error("Header row is empty");
  }

  const dataRows: TabularRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const record: Record<string, string> = {};
    for (let col = 0; col < headers.length; col += 1) {
      const header = headers[col];
      if (!header) {
        continue;
      }
      const cell = row[col] ?? "";
      record[header] = String(cell).trim();
    }
    dataRows.push({ rowNumber: i + 1, data: record });
  }

  return { headers, rows: dataRows };
}

/**
 * Normalize a header string for case-insensitive lookup
 */
export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Build a lookup map for case-insensitive header matching
 */
export function buildHeaderLookup(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    if (!normalized) continue;
    if (!map.has(normalized)) {
      map.set(normalized, header);
    }
  }
  return map;
}

/**
 * Resolve a header name using case-insensitive matching
 */
export function resolveHeader(
  headerLookup: Map<string, string>,
  header: string,
): string | null {
  const normalized = normalizeHeader(header);
  return headerLookup.get(normalized) ?? null;
}
