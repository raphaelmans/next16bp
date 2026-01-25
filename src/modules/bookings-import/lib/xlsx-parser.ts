/**
 * XLSX parsing utilities for bookings import
 */

import * as xlsx from "xlsx";
import { buildTabularDataset, type TabularDataset } from "./csv-parser";

/**
 * Parse XLSX buffer into a structured dataset
 */
export function parseXlsx(buffer: Buffer, sheetName?: string): TabularDataset {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const resolvedSheetName = sheetName ?? workbook.SheetNames[0];
  if (!resolvedSheetName) {
    throw new Error("XLSX has no sheets to parse");
  }
  const sheet = workbook.Sheets[resolvedSheetName];
  if (!sheet) {
    throw new Error(`XLSX sheet not found: ${resolvedSheetName}`);
  }

  const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const rows = (rawRows as unknown[][]).map((row: unknown[]) =>
    row.map((cell: unknown) => String(cell ?? "")),
  );

  return buildTabularDataset(rows);
}
