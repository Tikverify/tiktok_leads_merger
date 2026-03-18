/**
 * CSV Export Utility
 * Converts data to CSV format and handles download
 */

/**
 * Escape CSV field values
 * Handles quotes, commas, and newlines
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return "";
  }

  const stringValue = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape inner quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert data array to CSV string
 */
export function dataToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return "";
  }

  // Create header row
  const headerRow = headers.map(escapeCSVField).join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return headers.map((header) => escapeCSVField(row[header])).join(",");
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for UTF-8 encoding (helps with Excel and special characters)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export merged data as CSV
 */
export function exportAsCSV(data: any[], headers: string[], filename: string): void {
  try {
    const csvContent = dataToCSV(data, headers);
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    throw new Error("Failed to export CSV file");
  }
}
