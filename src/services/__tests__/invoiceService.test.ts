// import { generateInvoice, updateInvoiceStatus, formatCurrency } from '../invoiceService';
// import { mockClients } from '../../data/mockClientsData';

// describe('Invoice Service', () => {
//   const validClientId = mockClients[0].id;

//   describe('generateInvoice', () => {
//     it('should generate a valid invoice with correct calculations', async () => {
//       const result = await generateInvoice({
//         clientId: validClientId,
//         items: [
//           { description: 'Test Item 1', quantity: 2, unitPrice: 100 },
//           { description: 'Test Item 2', quantity: 1, unitPrice: 50 }
//         ],
//         taxRate: 13
//       });

//       if ('errors' in result) {
//         fail('Expected invoice but got errors');
//         return;
//       }

//       const { invoice } = result;
//       expect(invoice.subTotal).toBe(250);
//       expect(invoice.tax.amount).toBe(32.50);
//       expect(invoice.totalAmount).toBe(282.50);
//     });

//     it('should apply percentage discount correctly', async () => {
//       const result = await generateInvoice({
//         clientId: validClientId,
//         items: [
//           { description: 'Test Item', quantity: 1, unitPrice: 100 }
//         ],
//         discount: { type: 'percentage', value: 10 },
//         taxRate: 13
//       });

//       if ('errors' in result) {
//         fail('Expected invoice but got errors');
//         return;
//       }

//       const { invoice } = result;
//       expect(invoice.discount?.amount).toBe(10);
//       expect(invoice.totalAmount).toBe(101.70);
//     });

//     it('should return validation errors for invalid input', async () => {
//       const result = await generateInvoice({
//         clientId: validClientId,
//         items: [
//           { description: 'Test Item', quantity: -1, unitPrice: 100 }
//         ]
//       });

//       if (!('errors' in result)) {
//         fail('Expected errors but got invoice');
//         return;
//       }

//       expect(result.errors).toHaveLength(1);
//       expect(result.errors[0].field).toBe('items[0].quantity');
//     });
//   });

//   describe('updateInvoiceStatus', () => {
//     it('should allow valid status transitions', () => {
//       const invoice = {
//         status: 'Draft',
//         // ... other required invoice fields
//       } as any;

//       const result = updateInvoiceStatus(invoice, 'Pending');
//       expect('invoice' in result).toBe(true);
//       if ('invoice' in result) {
//         expect(result.invoice.status).toBe('Pending');
//       }
//     });

//     it('should prevent invalid status transitions', () => {
//       const invoice = {
//         status: 'Draft',
//         // ... other required invoice fields
//       } as any;

//       const result = updateInvoiceStatus(invoice, 'Paid');
//       expect('error' in result).toBe(true);
//     });
//   });

//   describe('formatCurrency', () => {
//     it('should format currency correctly', () => {
//       expect(formatCurrency(1234.56)).toBe('$1,234.56');
//       expect(formatCurrency(1000)).toBe('$1,000.00');
//       expect(formatCurrency(0)).toBe('$0.00');
//     });
//   });
// });