/**
 * Phone Number Filtering Utility - Production Grade
 * Filters all +2xx African country codes
 * Supports: +249 96 010 7260, +213 775 78 99 00, +212 782-642589, etc.
 * Detects both English and Arabic phone column names
 */

/**
 * Check if a country code is African (+2xx)
 */
export function isAfricanCountryCode(countryCode: string): boolean {
  // All African country codes start with 2 and are 2-3 digits
  // Examples: +20 (Egypt), +212 (Morocco), +213 (Algeria), +216 (Tunisia), +218 (Libya), +249 (Sudan), +227 (Niger), etc.
  return countryCode.startsWith("2") && countryCode.length >= 1 && countryCode.length <= 3;
}

/**
 * Extract and normalize country code from any phone format
 * Handles: +249..., 00249..., 249..., with spaces/dashes/parentheses
 * Returns: { countryCode: string, isAfrican: boolean }
 */
export function extractCountryCode(phone: string): {
  countryCode: string;
  isAfrican: boolean;
} {
  if (!phone || typeof phone !== "string") {
    return { countryCode: "", isAfrican: false };
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
  let countryCode = "";

  // Try 3-digit codes first (most specific)
  if (cleaned.length >= 3) {
    const threeDigit = cleaned.substring(0, 3);
    if (isAfricanCountryCode(threeDigit)) {
      countryCode = threeDigit;
    }
  }

  // If no 3-digit match, try 2-digit codes
  if (!countryCode && cleaned.length >= 2) {
    const twoDigit = cleaned.substring(0, 2);
    if (isAfricanCountryCode(twoDigit)) {
      countryCode = twoDigit;
    }
  }

  // If no 2-digit match, try 1-digit codes
  if (!countryCode && cleaned.length >= 1) {
    const oneDigit = cleaned.substring(0, 1);
    if (isAfricanCountryCode(oneDigit)) {
      countryCode = oneDigit;
    }
  }

  const isAfrican = isAfricanCountryCode(countryCode);

  return { countryCode, isAfrican };
}

/**
 * Check if a phone number belongs to Africa (+2xx)
 * Handles all format variations
 */
export function isAfricanNumber(phone: string): boolean {
  const { isAfrican } = extractCountryCode(phone);
  return isAfrican;
}

/**
 * Detect phone number column(s) in headers
 * Supports both English and Arabic column names
 * Returns array of column indices that likely contain phone numbers
 */
export function detectPhoneColumns(headers: string[]): number[] {
  // English phone keywords
  const englishPhoneKeywords = [
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

  // Arabic phone keywords
  const arabicPhoneKeywords = [
    "رقم الهاتف", // Phone number
    "رقم", // Number
    "هاتف", // Phone
    "جوال", // Mobile
    "رقم الجوال", // Mobile number
    "رقم الاتصال", // Contact number
    "تليفون", // Telephone
    "رقم الهاتف المحمول", // Mobile phone number
  ];

  return headers
    .map((header, index) => ({
      index,
      headerLower: header.toLowerCase(),
      headerOriginal: header,
    }))
    .filter((item) => {
      // Check English keywords
      const matchesEnglish = englishPhoneKeywords.some((keyword) =>
        item.headerLower.includes(keyword)
      );

      // Check Arabic keywords
      const matchesArabic = arabicPhoneKeywords.some((keyword) =>
        item.headerOriginal.includes(keyword)
      );

      return matchesEnglish || matchesArabic;
    })
    .map((item) => item.index);
}

/**
 * Filter out rows with African phone numbers (+2xx)
 * Returns filtered data and statistics
 */
export function filterAfricanLeads(
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
    // Check if any phone column in this row contains an African number
    for (const colIndex of phoneColumnIndices) {
      const phone = row[headers[colIndex]];
      if (phone && isAfricanNumber(phone)) {
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
