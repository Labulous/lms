import { 
  formatAccountNumber, 
  validateAccountNumber, 
  validateCaseNumber, 
  validateInvoiceNumber, 
  validateSalesNumber 
} from '../accountNumberFormatter';

describe('Account Number Formatting', () => {
  const accountNumber = '1001';

  describe('formatAccountNumber', () => {
    it('formats case numbers correctly', () => {
      expect(formatAccountNumber.case(accountNumber, 1)).toBe('1001-C0001');
      expect(formatAccountNumber.case(accountNumber, 123)).toBe('1001-C0123');
    });

    it('formats invoice numbers correctly', () => {
      expect(formatAccountNumber.invoice(accountNumber, 1)).toBe('1001-INV0001');
      expect(formatAccountNumber.invoice(accountNumber, 123)).toBe('1001-INV0123');
    });

    it('formats sales numbers correctly', () => {
      expect(formatAccountNumber.sales(accountNumber, 1)).toBe('1001-S0001');
      expect(formatAccountNumber.sales(accountNumber, 123)).toBe('1001-S0123');
    });
  });

  describe('validateAccountNumber', () => {
    it('validates correct account numbers', () => {
      expect(validateAccountNumber('1001')).toBe(true);
      expect(validateAccountNumber('9999')).toBe(true);
    });

    it('rejects invalid account numbers', () => {
      expect(validateAccountNumber('0999')).toBe(false); // Can't start with 0
      expect(validateAccountNumber('10001')).toBe(false); // Too long
      expect(validateAccountNumber('abc')).toBe(false); // Not numbers
      expect(validateAccountNumber('')).toBe(false); // Empty
    });
  });

  describe('validateCaseNumber', () => {
    it('validates correct case numbers', () => {
      expect(validateCaseNumber('1001-C0001')).toBe(true);
      expect(validateCaseNumber('9999-C9999')).toBe(true);
    });

    it('rejects invalid case numbers', () => {
      expect(validateCaseNumber('0999-C0001')).toBe(false); // Invalid account number
      expect(validateCaseNumber('1001-C00001')).toBe(false); // Too many digits
      expect(validateCaseNumber('1001-X0001')).toBe(false); // Wrong prefix
    });
  });

  describe('validateInvoiceNumber', () => {
    it('validates correct invoice numbers', () => {
      expect(validateInvoiceNumber('1001-INV0001')).toBe(true);
      expect(validateInvoiceNumber('9999-INV9999')).toBe(true);
    });

    it('rejects invalid invoice numbers', () => {
      expect(validateInvoiceNumber('0999-INV0001')).toBe(false); // Invalid account number
      expect(validateInvoiceNumber('1001-INV00001')).toBe(false); // Too many digits
      expect(validateInvoiceNumber('1001-IN0001')).toBe(false); // Wrong prefix
    });
  });

  describe('validateSalesNumber', () => {
    it('validates correct sales numbers', () => {
      expect(validateSalesNumber('1001-S0001')).toBe(true);
      expect(validateSalesNumber('9999-S9999')).toBe(true);
    });

    it('rejects invalid sales numbers', () => {
      expect(validateSalesNumber('0999-S0001')).toBe(false); // Invalid account number
      expect(validateSalesNumber('1001-S00001')).toBe(false); // Too many digits
      expect(validateSalesNumber('1001-X0001')).toBe(false); // Wrong prefix
    });
  });
});
