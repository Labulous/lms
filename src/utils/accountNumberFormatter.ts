/**
 * Formats case numbers, invoice numbers, and sales numbers based on client account number
 */
export const formatAccountNumber = {
  /**
   * Format a case number (e.g., "1001-C0001")
   * @param accountNumber - Client account number
   * @param caseNumber - Sequential case number
   */
  case: (accountNumber: string, caseNumber: number): string => 
    `${accountNumber}-C${String(caseNumber).padStart(4, '0')}`,

  /**
   * Format an invoice number (e.g., "1001-INV0001")
   * @param accountNumber - Client account number
   * @param invoiceNumber - Sequential invoice number
   */
  invoice: (accountNumber: string, invoiceNumber: number): string => 
    `${accountNumber}-INV${String(invoiceNumber).padStart(4, '0')}`,

  /**
   * Format a sales record number (e.g., "1001-S0001")
   * @param accountNumber - Client account number
   * @param salesNumber - Sequential sales number
   */
  sales: (accountNumber: string, salesNumber: number): string => 
    `${accountNumber}-S${String(salesNumber).padStart(4, '0')}`
};

/**
 * Validates account number format
 * @param accountNumber - Account number to validate
 * @returns boolean indicating if format is valid
 */
export const validateAccountNumber = (accountNumber: string): boolean => {
  // Account numbers should be 4 digits starting from 1001
  return /^[1-9]\d{3}$/.test(accountNumber);
};

/**
 * Validates case number format
 * @param caseNumber - Case number to validate
 * @returns boolean indicating if format is valid
 */
export const validateCaseNumber = (caseNumber: string): boolean => {
  // Case numbers should be in format XXXX-CXXXX (e.g., 1001-C0001)
  return /^[1-9]\d{3}-C\d{4}$/.test(caseNumber);
};

/**
 * Validates invoice number format
 * @param invoiceNumber - Invoice number to validate
 * @returns boolean indicating if format is valid
 */
export const validateInvoiceNumber = (invoiceNumber: string): boolean => {
  // Invoice numbers should be in format XXXX-INVXXXX (e.g., 1001-INV0001)
  return /^[1-9]\d{3}-INV\d{4}$/.test(invoiceNumber);
};

/**
 * Validates sales record number format
 * @param salesNumber - Sales record number to validate
 * @returns boolean indicating if format is valid
 */
export const validateSalesNumber = (salesNumber: string): boolean => {
  // Sales numbers should be in format XXXX-SXXXX (e.g., 1001-S0001)
  return /^[1-9]\d{3}-S\d{4}$/.test(salesNumber);
};

/**
 * Custom error for account number related issues
 */
export class AccountNumberError extends Error {
  constructor(message: string) {
    super(`Account Number Error: ${message}`);
    this.name = 'AccountNumberError';
  }
}
