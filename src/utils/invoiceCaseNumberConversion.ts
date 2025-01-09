/**
 * Utility functions for case and invoice number formatting
 */

const CASE_PREFIX = "LAB";
const INVOICE_PREFIX = "INV";
const NUMBER_FORMAT = /^(LAB|INV)-(\d{4})-(\d{5})$/;

interface ParsedNumber {
  prefix: string;
  yearMonth: string;
  sequence: string;
}

/**
 * Converts between case and invoice numbers
 * @param number The case or invoice number to convert
 * @returns The converted number, or null if invalid format
 *
 * @example
 * convertNumber('LAB-2312-00001') // Returns 'INV-2312-00001'
 * convertNumber('INV-2312-00001') // Returns 'LAB-2312-00001'
 */
import { supabase } from "../lib/supabase";

export async function fetchCaseCount(labId: string) {
  const { count, error } = await supabase
    .from("cases") // Replace with your table name
    .select("*", { count: "exact" })
    .eq("lab_id", labId);

  if (error) {
    console.error("Error fetching case count:", error);
    return 0; // Default to 0 if there's an error
  }

  return count || 0;
}

export function convertNumber(number: string): string | null {
  const match = number.match(NUMBER_FORMAT);
  if (!match) return null;

  const [_, prefix, yearMonth, sequence] = match;
  const newPrefix = prefix === CASE_PREFIX ? INVOICE_PREFIX : CASE_PREFIX;

  return `${newPrefix}-${yearMonth}-${sequence}`;
}

/**
 * Validates a case or invoice number format
 * @param number The number to validate
 * @returns True if valid format, false otherwise
 *
 * @example
 * isValidNumber('LAB-2312-00001') // Returns true
 * isValidNumber('INV-2312-00001') // Returns true
 * isValidNumber('ABC-2312-00001') // Returns false
 */
export function isValidNumber(number: string): boolean {
  return NUMBER_FORMAT.test(number);
}

/**
 * Parses a case or invoice number into its components
 * @param number The number to parse
 * @returns Object containing the components, or null if invalid format
 *
 * @example
 * parseNumber('LAB-2312-00001')
 * // Returns { prefix: 'LAB', yearMonth: '2312', sequence: '00001' }
 */
export function parseNumber(number: string): ParsedNumber | null {
  const match = number.match(NUMBER_FORMAT);
  if (!match) return null;

  const [_, prefix, yearMonth, sequence] = match;
  return { prefix, yearMonth, sequence };
}

/**
 * Generates the next sequence number for a given year and month
 * @param yearMonth Year and month in YYMM format
 * @param currentSequence Current highest sequence number
 * @returns Next sequence number padded with zeros
 *
 * @example
 * getNextSequence('2312', '00001') // Returns '00002'
 */
export function getNextSequence(
  yearMonth: string,
  currentSequence: string
): string {
  const nextNum = parseInt(currentSequence, 10) + 1;
  return nextNum.toString().padStart(5, "0");
}

/**
 * Formats a case or invoice number from its components
 * @param prefix Prefix (LAB or INV)
 * @param yearMonth Year and month in YYMM format
 * @param sequence Sequence number
 * @returns Formatted number string
 *
 * @example
 * formatNumber('LAB', '2312', '00001') // Returns 'LAB-2312-00001'
 */
export function formatNumber(
  prefix: string,
  yearMonth: string,
  sequence: string
): string {
  if (prefix !== CASE_PREFIX && prefix !== INVOICE_PREFIX) {
    throw new Error("Invalid prefix. Must be LAB or INV");
  }

  if (!/^\d{4}$/.test(yearMonth)) {
    throw new Error("Invalid year/month format. Must be YYMM");
  }

  if (!/^\d{5}$/.test(sequence)) {
    throw new Error("Invalid sequence format. Must be 5 digits");
  }

  return `${prefix}-${yearMonth}-${sequence}`;
}
