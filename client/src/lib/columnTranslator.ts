/**
 * Arabic to English Column Name Translator
 * Translates common Arabic column headers to English
 */

// Comprehensive mapping of Arabic column names to English
const arabicToEnglishMap: Record<string, string> = {
  // Common lead fields
  "رقم الهاتف": "Phone Number",
  "هاتف": "Phone",
  "رقم": "Number",
  "البريد الإلكتروني": "Email",
  "بريد": "Email",
  "الاسم": "Name",
  "اسم": "Name",
  "الاسم الأول": "First Name",
  "الاسم الأخير": "Last Name",
  "الاسم الكامل": "Full Name",

  // Location fields
  "المدينة": "City",
  "الدولة": "Country",
  "المنطقة": "Region",
  "الحي": "District",
  "الشارع": "Street",
  "العنوان": "Address",
  "الرمز البريدي": "Postal Code",

  // Business fields
  "الشركة": "Company",
  "المسمى الوظيفي": "Job Title",
  "الصناعة": "Industry",
  "القطاع": "Sector",

  // Date/Time fields
  "التاريخ": "Date",
  "الوقت": "Time",
  "تاريخ الإنشاء": "Created Date",
  "تاريخ التحديث": "Updated Date",
  "تاريخ الميلاد": "Date of Birth",

  // Status fields
  "الحالة": "Status",
  "النوع": "Type",
  "الفئة": "Category",
  "الأولوية": "Priority",

  // Campaign/Marketing fields
  "الحملة": "Campaign",
  "المصدر": "Source",
  "الوسيط": "Medium",
  "المحتوى": "Content",
  "الكلمة المفتاحية": "Keyword",

  // Social media fields
  "تيك توك": "TikTok",
  "فيسبوك": "Facebook",
  "إنستجرام": "Instagram",
  "تويتر": "Twitter",
  "واتس آب": "WhatsApp",
  "لينكد إن": "LinkedIn",

  // Additional common fields
  "الملاحظات": "Notes",
  "الوصف": "Description",
  "التعليقات": "Comments",
  "الجنس": "Gender",
  "العمر": "Age",
  "اللغة": "Language",
  "الموافقة": "Consent",
  "معرف": "ID",
  "معرف العميل": "Customer ID",
  "معرف الحملة": "Campaign ID",
  "معرف الإعلان": "Ad ID",
  "معرف المجموعة": "Group ID",
  "معرف النموذج": "Form ID",
  "اسم النموذج": "Form Name",
  "نوع النموذج": "Form Type",
};

/**
 * Translate a single column name from Arabic to English
 * If not found in map, returns original name
 */
export function translateColumnName(columnName: string): string {
  // Check exact match first
  if (arabicToEnglishMap[columnName]) {
    return arabicToEnglishMap[columnName];
  }

  // Check case-insensitive match
  const lowerColumnName = columnName.toLowerCase();
  for (const [arabic, english] of Object.entries(arabicToEnglishMap)) {
    if (arabic.toLowerCase() === lowerColumnName) {
      return english;
    }
  }

  // If no match found, return original
  return columnName;
}

/**
 * Translate all column headers in data array
 * Returns new data with translated headers
 */
export function translateColumnHeaders(
  data: any[],
  headers: string[]
): { translatedData: any[]; translatedHeaders: string[] } {
  if (data.length === 0) {
    return { translatedData: [], translatedHeaders: [] };
  }

  // Create mapping of old headers to new headers
  const headerMapping: Record<string, string> = {};
  const translatedHeaders = headers.map((header) => {
    const translated = translateColumnName(header);
    headerMapping[header] = translated;
    return translated;
  });

  // Transform data with new headers
  const translatedData = data.map((row) => {
    const newRow: Record<string, any> = {};
    for (const [oldHeader, value] of Object.entries(row)) {
      const newHeader = headerMapping[oldHeader] || oldHeader;
      newRow[newHeader] = value;
    }
    return newRow;
  });

  return { translatedData, translatedHeaders };
}

/**
 * Check if headers contain any Arabic text
 */
export function hasArabicHeaders(headers: string[]): boolean {
  const arabicRegex = /[\u0600-\u06FF]/; // Arabic Unicode range
  return headers.some((header) => arabicRegex.test(header));
}
