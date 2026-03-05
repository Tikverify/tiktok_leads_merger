/**
 * Phone Number Filtering Utility - Production Grade
 * Handles all phone number formats and reliably detects country codes
 * Supports: +249 96 010 7260, +213 775 78 99 00, +212 782-642589, etc.
 */

// North African country codes to filter
const NORTH_AFRICA_CODES = ["213", "216", "212", "218", "20", "249"];

/**
 * Extract and normalize country code from any phone format
 * Handles: +249..., 00249..., 249..., with spaces/dashes/parentheses
 * Returns: { countryCode: string, isNorthAfrican: boolean }
 */
export function extractCountryCode(phone: string): {
  countryCode: string;
  isNorthAfrican: boolean;
} {
  if (!phone || typeof phone !== "string") {
    return { countryCode: "", isNorthAfrican: false };
  }

  // Step 1: Remove all whitespace, dashes, parentheses, and dots
  let cleaned = phone.trim().replace(/[\s\-().,]/g, "");

  // Step 2: Handle + prefix
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Step 3: Handle 00 prefix (international format)
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Step 4: Extract country code (1-3 digits at the start)
  // Most country codes are 1-3 digits, with special cases:
  // - Single digit: 1 (North America), 7 (Russia)
  // - Two digits: 20 (Egypt), 27 (South Africa), 33 (France), etc.
  // - Three digits: 212 (Morocco), 213 (Algeria), 216 (Tunisia), etc.

  let countryCode = "";

  // Try 3-digit codes first (most specific)
  if (cleaned.length >= 3) {
    const threeDigit = cleaned.substring(0, 3);
    if (NORTH_AFRICA_CODES.includes(threeDigit)) {
      countryCode = threeDigit;
    }
  }

  // If no 3-digit match, try 2-digit codes
  if (!countryCode && cleaned.length >= 2) {
    const twoDigit = cleaned.substring(0, 2);
    if (NORTH_AFRICA_CODES.includes(twoDigit)) {
      countryCode = twoDigit;
    }
  }

  // If no 2-digit match, try 1-digit codes (only "1" is in our list for North Africa context)
  if (!countryCode && cleaned.length >= 1) {
    const oneDigit = cleaned.substring(0, 1);
    if (NORTH_AFRICA_CODES.includes(oneDigit)) {
      countryCode = oneDigit;
    }
  }

  const isNorthAfrican = NORTH_AFRICA_CODES.includes(countryCode);

  return { countryCode, isNorthAfrican };
}

/**
 * Check if a phone number belongs to North Africa
 * Handles all format variations
 */
export function isNorthAfricanNumber(phone: string): boolean {
  const { isNorthAfrican } = extractCountryCode(phone);
  return isNorthAfrican;
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
    "phone_number",
    "mobile_number",
    "contactnumber",
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
