/**
 * Phone Number Filtering Utility
 * Detects and filters out North African country codes
 */

// North African country codes to filter
const NORTH_AFRICA_CODES = [
  "213", // Algeria
  "216", // Tunisia
  "212", // Morocco
  "218", // Libya
  "20",  // Egypt
  "249", // Sudan
];

/**
 * Normalize phone number to a standard format for comparison
 * Handles: +212..., 00212..., 212... formats
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") return "";

  // Remove all whitespace and hyphens
  let normalized = phone.trim().replace(/[\s\-()]/g, "");

  // Handle +212 format
  if (normalized.startsWith("+")) {
    normalized = normalized.substring(1);
  }

  // Handle 00212 format (convert to 212)
  if (normalized.startsWith("00")) {
    normalized = normalized.substring(2);
  }

  return normalized;
}

/**
 * Check if a phone number belongs to North Africa
 */
export function isNorthAfricanNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);

  // Check if the normalized number starts with any North African code
  return NORTH_AFRICA_CODES.some((code) => normalized.startsWith(code));
}

/**
 * Detect phone number column(s) in headers
 * Returns array of column indices that likely contain phone numbers
 */
export function detectPhoneColumns(headers: string[]): number[] {
  const phoneKeywords = [
    "phone",
    "mobile",
    "number",
    "contact",
    "tel",
    "telephone",
    "cell",
    "cellphone",
    "whatsapp",
    "phonenumber",
  ];

  return headers
    .map((header, index) => ({
      index,
      header: header.toLowerCase(),
    }))
    .filter((item) => phoneKeywords.some((keyword) => item.header.includes(keyword)))
    .map((item) => item.index);
}

/**
 * Filter out rows with North African phone numbers
 * Returns filtered data and statistics
 */
export function filterNorthAfricanLeads(
  data: any[],
  headers: string[]
): { filteredData: any[]; removedCount: number; phoneColumnsUsed: string[] } {
  const phoneColumnIndices = detectPhoneColumns(headers);
  const phoneColumnsUsed = phoneColumnIndices.map((i) => headers[i]);

  if (phoneColumnIndices.length === 0) {
    // No phone columns detected, return original data
    return {
      filteredData: data,
      removedCount: 0,
      phoneColumnsUsed: [],
    };
  }

  let removedCount = 0;
  const filteredData = data.filter((row) => {
    // Check if any phone column in this row contains a North African number
    for (const colIndex of phoneColumnIndices) {
      const phone = row[headers[colIndex]];
      if (phone && isNorthAfricanNumber(phone)) {
        removedCount++;
        return false; // Remove this row
      }
    }
    return true; // Keep this row
  });

  return {
    filteredData,
    removedCount,
    phoneColumnsUsed,
  };
}
