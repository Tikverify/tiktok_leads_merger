/**
 * Deduplication Utility
 * Removes duplicate leads based on phone number, email, or lead_id
 */

/**
 * Normalize phone number for comparison
 * Removes all non-digit characters
 */
function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}

/**
 * Normalize email for comparison
 * Converts to lowercase and trims
 */
function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim();
}

/**
 * Find phone columns in headers
 */
function findPhoneColumns(headers: string[]): number[] {
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
    "رقم الهاتف",
    "رقم",
    "هاتف",
    "جوال",
  ];

  return headers
    .map((header, index) => ({
      index,
      headerLower: header.toLowerCase(),
      headerOriginal: header,
    }))
    .filter((item) => {
      const matchesEnglish = phoneKeywords.some((keyword) =>
        item.headerLower.includes(keyword)
      );
      const matchesArabic = phoneKeywords.some((keyword) =>
        item.headerOriginal.includes(keyword)
      );
      return matchesEnglish || matchesArabic;
    })
    .map((item) => item.index);
}

/**
 * Find email columns in headers
 */
function findEmailColumns(headers: string[]): number[] {
  const emailKeywords = ["email", "mail", "e-mail", "البريد", "بريد"];

  return headers
    .map((header, index) => ({
      index,
      headerLower: header.toLowerCase(),
      headerOriginal: header,
    }))
    .filter((item) => {
      const matchesEnglish = emailKeywords.some((keyword) =>
        item.headerLower.includes(keyword)
      );
      const matchesArabic = emailKeywords.some((keyword) =>
        item.headerOriginal.includes(keyword)
      );
      return matchesEnglish || matchesArabic;
    })
    .map((item) => item.index);
}

/**
 * Find lead_id or id columns
 */
function findIdColumns(headers: string[]): number[] {
  const idKeywords = ["lead_id", "leadid", "id", "lead id", "معرف"];

  return headers
    .map((header, index) => ({
      index,
      headerLower: header.toLowerCase(),
      headerOriginal: header,
    }))
    .filter((item) => {
      const matchesEnglish = idKeywords.some((keyword) =>
        item.headerLower.includes(keyword)
      );
      const matchesArabic = idKeywords.some((keyword) =>
        item.headerOriginal.includes(keyword)
      );
      return matchesEnglish || matchesArabic;
    })
    .map((item) => item.index);
}

/**
 * Create a unique key for a lead based on phone, email, and id
 */
function createLeadKey(row: any, headers: string[]): string {
  const phoneColumns = findPhoneColumns(headers);
  const emailColumns = findEmailColumns(headers);
  const idColumns = findIdColumns(headers);

  const keys: string[] = [];

  // Add phone numbers
  phoneColumns.forEach((colIndex) => {
    const phone = row[headers[colIndex]];
    if (phone) {
      const normalized = normalizePhone(String(phone));
      if (normalized) keys.push(`phone:${normalized}`);
    }
  });

  // Add emails
  emailColumns.forEach((colIndex) => {
    const email = row[headers[colIndex]];
    if (email) {
      const normalized = normalizeEmail(String(email));
      if (normalized) keys.push(`email:${normalized}`);
    }
  });

  // Add IDs
  idColumns.forEach((colIndex) => {
    const id = row[headers[colIndex]];
    if (id) {
      keys.push(`id:${String(id).toLowerCase().trim()}`);
    }
  });

  return keys.join("|");
}

/**
 * Remove duplicate leads from data
 * Keeps the first occurrence of each unique lead
 */
export function removeDuplicateLeads(
  data: any[],
  headers: string[]
): { deduplicatedData: any[]; removedCount: number } {
  const seen = new Set<string>();
  let removedCount = 0;

  const deduplicatedData = data.filter((row) => {
    const key = createLeadKey(row, headers);

    // If no identifying information, keep the row
    if (!key) {
      return true;
    }

    // If we've seen this key before, remove it
    if (seen.has(key)) {
      removedCount++;
      return false;
    }

    // First time seeing this key, keep it
    seen.add(key);
    return true;
  });

  return { deduplicatedData, removedCount };
}

/**
 * Check if data has any identifying columns (phone, email, id)
 */
export function hasIdentifyingColumns(headers: string[]): boolean {
  const phoneColumns = findPhoneColumns(headers);
  const emailColumns = findEmailColumns(headers);
  const idColumns = findIdColumns(headers);

  return phoneColumns.length > 0 || emailColumns.length > 0 || idColumns.length > 0;
}
