# Billing Module Product Requirement Document (PRD)

## 1. Overview
The **Billing Module** is designed to streamline invoice management, payment processing, and balance tracking for Labulous, a lab management software (LMS). It includes tools for both admin and client users to handle transactions efficiently.

## 2. Objectives
- Enable **admins** to log and process payments manually.
- Facilitate **clients** in making partial or full payments online using **Stripe**.
- Provide comprehensive transaction and balance visibility.
- Automate updates for invoice statuses and client balances.

## 3. Features and Functionality
### 3.1 Invoice Management
- **Creation:**
  - Generate dynamic invoices based on case data.
  - Customizable line items: technician hours, materials, service charges.
  - Automatic calculation of taxes and discounts if the items included in the invoice is set to be taxable. 
  - Printable Invoices in PDF format or html format has to comply with the following dimensions:
  -- Letter: 8.5 x 11 inches
  -- Legal: 8.5 x 14 inches
  -- Half size: 5.5 x 8.5 inches

- **Management:**
  - Filter invoices by status: Paid, Pending, Overdue, Partially Paid.
  - Edit, resend, or delete invoices.
  - View detailed invoice histories.
- **Client Interaction:**
  - Include secure payment links for Stripe integration.

### 3.2 Payments
- **Client Payments:**
  - Enable secure payments via Stripe.
  - Allow full or partial invoice payments.
  - Auto-generate receipts and update balances after payment.
- **Admin Payments:**
  - Log manual payments: cash, cheque, bank transfer, etc.
  - Allocate payments across multiple invoices.
  - Record detailed payment info (date, method, amount, notes).
- **Adjustments:**
  - Record overpayments or refunds.
- **Notifications:**
  - Notify clients of logged payments or payment receipts.

### 3.3 Balance Tracking
- Automatically update balances after payments.
- Maintain a carry-forward mechanism for unpaid balances.

### 3.4 Statements
- Generate comprehensive transaction statements:
  - Payments made.
  - Outstanding balances.
  - Invoice and payment histories.
- Export options: PDF or Excel.

## 4. User Stories
### Admins/Managers
- **Log manual payments** for non-digital transactions.
- **Allocate payments** across multiple invoices for partial payments.
- **Track balances** and make adjustments for financial accuracy.

### Clients
- Pay invoices online for **convenient settlement**.
- View detailed statements for **record reconciliation**.
- Receive notifications about **balance updates**.

## 5. Technical Requirements
### Frontend
- Under the Billing category:
    - Invoices
    - Payments
    - Balance Tracking
    - Statements
    - Adjustments
- Add a **Payments tab** under the Billing category.
- Provide:
  - **Admin interface:** for logging and managing payments.
  - **Client interface:** for Stripe-based payments.
  - **Real-time updates** for balances and invoice statuses.
  - Downloadable **receipts** post-payment.

#### Front-end Components for the Invoices page
##### 1. Header Section
- **Title:** "Invoices"
- **Filters:**
  - **Date Selector:** Dropdown or calendar picker for filtering by date range.
  - **Status Dropdown:** Filter by statuses like "Unpaid," "Paid," "Overdue," etc.
  - **Aging Filter:** View invoices based on aging categories (e.g., 30, 60, 90+ days).
  - **Group Filter:** Group invoices by client, status, or other categories.
- **Search Bar:** Search by **Invoice Number**, **Amount**, or **Client Name**.

##### 2. Data Table
- **Columns:**
  - **Date:** Invoice date in `DD/MM/YY` format.
  - **Status:** Payment status (e.g., Unpaid, Paid, Partially Paid).
  - **Invoice #:** Hyperlink to the detailed invoice view.
  - **Patient:** Display the patient name (optional).
  - **Client:** Client's name (e.g., dental clinic).
  - **Amount:** Total invoice amount.
  - **Balance:** Outstanding balance.
  - **Due Date:** Payment due date.
- **Row Actions:**
  - **Options Button:** Dropdown for actions (e.g., Edit, Resend, Delete).
  - **Checkbox:** For bulk actions like exporting or deleting invoices.

##### 3. Bulk Actions Section
- **Export Button:** Export selected invoices as PDF, Excel, or CSV.
- **Actions Button:** Perform batch actions, including:
  - Mark as Paid.
  - Send Payment Reminder.
  - Delete Selected.

##### 4. Pagination
- **Controls:** Rows per page display (e.g., "1-20 of 23") with next/previous page navigation.

##### 5. Notifications & Tooltips
- **Notifications:** Inline success/error messages for actions (e.g., "Invoice Deleted").
- **Tooltips:** Add context to column headers or action buttons.

##### 6. Accessibility Features
- **Keyboard Navigation:** Tab and arrow key navigation for interactive elements.
- **Screen Reader Support:** Labels for compatibility with assistive technologies.

##### 7. Visual Styling
- **Color Coding:**
  - **Red:** Overdue invoices.
  - **Yellow:** Invoices nearing their due date.
  - **Green:** Fully paid invoices.
- **Icons:**
  - Priority flags for aging or overdue invoices.
  - Actionable icons for settings and editing.

#### Front-End Components for the "Payments" Page

##### 1. Header Section
- **Title:** "Payments" 
- **Filters:**
  - **Date Selector:** Dropdown for filtering payments by date range.
  - **Payment Methods Dropdown:** Filter by payment methods (e.g., Check, Credit Card, Bank Transfer, etc.).
  - **Payment Status Dropdown:** Filter payments by status (e.g., All Payments, Applied, Unapplied).
- **Search Bar:** Search functionality to find payments by client name, payment method, or memo.

##### 2. Data Table
- **Columns:**
  - **Date:** Payment date in `DD/MM/YY` format.
  - **Client:** Name of the client (e.g., dental clinic or organization).
  - **Payment Method:** Method used for the payment (e.g., Check, Credit Card, Bank Transfer, Cash, Other).
  - **Memo:** Notes or details about the payment.
  - **Amount:** Payment amount made by the client.
  - **Applied:** Amount from the payment that has been applied to an invoice.
  - **Unapplied:** Amount from the payment that hasn’t been applied to any invoice.

- **Row Actions:**
  - **Checkbox:** For selecting payments to perform bulk actions like exporting or deleting.

---

##### 3. Bulk Actions Section
- **Export Button:** Export selected payments as PDF, Excel, or CSV.
- **Download Button:** Option to download payment reports or logs.
- **Email Button:** Send payment details to clients via email.
- **New Payment Button:** Call-to-action (CTA) button to add a new payment (Just a placeholder for now).

---

##### 4. Pagination
- **Controls:** Rows per page selector (e.g., 10, 20, 50) with next/previous navigation.

---

#### New Payment Modal Components

##### 1. Payment Information Section
- **Client Dropdown:** Select the client making the payment.
- **Date Picker:** Set the date for the payment.
- **Payment Method Dropdown:** Choose from options like:
  - Check
  - Credit Card
  - Bank Transfer
  - Cash
  - PayPal
  - Other
- **Memo Field:** Text input for notes or descriptions about the payment.

---

##### 2. Balance Summary Section
- **Balances Overview:**
  - Current and historical balances for the client (e.g., This Month, Last Month, 30+ Days, 60+ Days, etc.).
- **Payment Calculator:**
  - Field to enter the payment amount.
  - Automatically updates unapplied balance based on the entered amount.

---

##### 3. Invoice Allocation Section
- **Invoice Table:**
  - **Columns:**
    - Date: Invoice date.
    - Original Amount: Total amount of the invoice.
    - Amount Due: Outstanding balance for the invoice.
    - Checkbox: For selecting invoices to apply the payment to.
- **Dynamic Allocation:** Auto-apply payments to invoices based on selected rows and payment amount entered.

---

##### 4. Actions
- **Create Button:** Finalize the payment and apply it to selected invoices.
- **Cancel Button:** Close the modal without saving.

---

##### Notifications & Validation
- **Success Notifications:** Show confirmation for successful payment creation or updates.
- **Error Alerts:** Display validation errors for required fields (e.g., missing client or payment method).
- **Tooltips:** Provide hints for payment methods, balance breakdown, or allocation rules.

---

##### Accessibility Features
- **Keyboard Navigation:** Ensure modal and table are accessible via keyboard shortcuts.
- **Screen Reader Support:** ARIA labels for input fields, dropdowns, and buttons.

---

#### Front-End Components for the "Balances" Page

##### 1. Header Section
- **Title:** "Balances"
- **Filters:**
  - **Outstanding Balance Dropdown:** Filter by balance types (e.g., Outstanding, Credit, etc.).
  - **Search Bar:** Search functionality to find balances by client name.

##### 2. Data Table
- **Columns:**
  - **Client:** Client's name (e.g., dental clinic or organization).
  - **Outstanding Balance:** Total unpaid balance for the client.
  - **Credit Balance:** Amount the client has as credit.
  - **This Month:** Payments or balances due for the current month.
  - **Last Month:** Payments or balances due for the previous month.
  - **30+ Days:** Balances overdue for more than 30 days.
  - **60+ Days:** Balances overdue for more than 60 days.
  - **90+ Days:** Balances overdue for more than 90 days.
  - **Finance Charge:** Any additional charges applied to overdue balances.
- **Row Actions:**
  - **Settings/Options Button:** Dropdown for client-specific actions like sending reminders or adjusting balances.
  - **Checkbox:** For selecting clients to perform bulk actions.

---

##### 3. Bulk Actions Section
- **Print Dropdown:** Option to print the balance report.
- **Payment Reminder Dropdown:** Send reminders for selected clients via email.

---

##### 4. Footer Summary Row
- **Totals Row:**
  - Displays the sum of outstanding balances, credit balances, and balances across various time periods.
  - Dynamically updates based on filters applied.

---

##### 5. Pagination
- **Controls:** Rows per page selector (e.g., 10, 20, 50) with next/previous navigation.

---

#### Notifications & Validation
- **Success Notifications:** Show confirmation for successful actions like sending payment reminders or generating reports.
- **Error Alerts:** Display validation errors for required fields (e.g., missing client information when sending reminders).

---

#### Accessibility Features
- **Keyboard Navigation:** Ensure table and action buttons are accessible via keyboard shortcuts.
- **Screen Reader Support:** ARIA labels for input fields, table headers, and action buttons.

---

#### Additional Features
- **Dynamic Updates:** Totals row dynamically updates based on applied filters.
- **Email & Print Actions:** Options to export the balance report or email reminders directly from the interface.

---

This breakdown provides a comprehensive view of the "Balances" page, ensuring consistent formatting with the "Invoices" and "Payments" documentation. Let me know if you need adjustments!

---

#### Front-End Components for the "Statements" Page

##### 1. Header Section
- **Title:** "Statements"
- **Filters:**
  - **Client Status Dropdown:** Filter by active or inactive clients.
  - **Search Bar:** Search functionality to find statements by client name or statement number.

---

##### 2. Data Table
- **Columns:**
  - **Date:** Date the statement was generated in `DD/MM/YY` format.
  - **Statement #:** Hyperlinked to a detailed view of the specific statement.
  - **Client:** Name of the client (e.g., dental clinic or organization).
  - **Amount:** Total amount billed on the statement.
  - **Outstanding Amount:** Balance still unpaid from the statement.
  - **Last Sent:** Date the statement was last sent to the client.
- **Row Actions:**
  - **Settings/Options Button:** Dropdown for actions such as editing, resending, or deleting a statement.
  - **Checkbox:** For selecting statements to perform bulk actions.

---

##### 3. Bulk Actions Section
- **Print Dropdown:** Option to print one or multiple statements.
- **Email Dropdown:** Option to email selected statements directly to clients.
- **Rollback Button:** Revert a generated statement to allow updates (useful for adjustments).
- **New Statement Button:** Call-to-action (CTA) to generate a new statement.

---

##### 4. Pagination
- **Controls:** Rows per page selector (e.g., 10, 20, 50) with next/previous navigation.

---

#### Notifications & Validation
- **Success Notifications:**
  - Confirmation for successful actions such as generating, emailing, or rolling back statements.
- **Error Alerts:**
  - Validation errors when required fields (e.g., client or statement details) are missing or incorrect.

---

#### Additional Features
- **Static Snapshot of Billing Activity:** Each statement reflects a snapshot of billing activity for a given month. Changes like new payments or credits will not appear on previously generated statements.
- **Dynamic Update Alerts:** Prompt the user to generate a new statement if adjustments or updates have occurred since the last statement was created.

---

#### Accessibility Features
- **Keyboard Navigation:** Enable users to navigate through tables, filters, and action buttons using keyboard shortcuts.
- **Screen Reader Support:** ARIA labels for input fields, table headers, and action buttons.

---

### User Workflow for "New Statement"
1. **Select Client or Group:** User selects the client or client group for which the statement will be generated.
2. **Generate Statement:** User clicks the "New Statement" button to create a snapshot of billing activity for the selected timeframe.
3. **Review and Send:** Once generated, the statement is displayed, and users can review details before printing or emailing.

---

This breakdown ensures consistency with the "Invoices," "Payments," and "Balances" documentation and highlights the unique aspects of the "Statements" page. Let me know if further details are needed!

---

#### Front-End Components for the "Adjustments" Page

##### 1. Header Section
- **Title:** "Adjustments"
- **Filters:**
  - **Date Dropdown:** Filter adjustments by specific time periods (e.g., "All Dates," "Last 30 Days", "Last 60 Days", "Last 90 Days").
  - **Search Bar:** Search functionality to find adjustments by client name or description.

---

##### 2. Data Table
- **Columns:**
  - **Date:** Date the adjustment was applied in `DD/MM/YY` format.
  - **Client:** Name of the client (e.g., dental clinic or organization).
  - **Description:** Text description or reason for the adjustment (e.g., "Credit for early payment").
  - **Credit Amount:** Amount credited to the client's account (displayed in parentheses to indicate credits).
  - **Debit Amount:** Amount debited from the client's account.
- **Row Actions:**
  - **Settings/Options Button:** Dropdown for actions such as editing or deleting an adjustment.

---

##### 3. Bulk Actions Section
- **New Adjustment Button:** Call-to-action (CTA) button to add a new adjustment.

---

#### New Adjustment Workflow
##### 1. Adjustment Information Section
- **Client Selector:** Dropdown to select the client for the adjustment.
- **Date Picker:** Set the date for the adjustment.
- **Adjustment Type Dropdown:** Choose from:
  - Credit
  - Debit
- **Amount Field:** Input field to specify the adjustment amount.
- **Description Field:** Text input for a detailed explanation or reason for the adjustment.

##### 2. Action Buttons
- **Create Button:** Apply the adjustment to the selected client.
- **Cancel Button:** Discard the changes and return to the adjustments page.

---

#### Notifications & Validation
- **Success Notifications:**
  - Confirmation message for successful adjustment creation or updates.
- **Error Alerts:**
  - Validation errors for missing required fields (e.g., client, amount, or adjustment type).
- **Tooltips:**
  - Provide contextual hints for fields like "Adjustment Type" or "Description."

---

#### Accessibility Features
- **Keyboard Navigation:** Enable users to navigate through filters, tables, and input fields using keyboard shortcuts.
- **Screen Reader Support:** ARIA labels for input fields, table headers, and action buttons.

---

#### Additional Features
- **Impact on Statements:**
  - Adjustments (credit or debit) will be reflected in client statements alongside their description.
- **Dynamic Totals:** Totals update dynamically based on applied filters.

---

#### User Workflow for "New Adjustment"
1. **Select Client:** Admin selects the client for whom the adjustment is being applied.
2. **Choose Adjustment Type:** Admin specifies whether it’s a credit or debit.
3. **Enter Details:** Admin provides the amount and description of the adjustment.
4. **Save Adjustment:** Adjustment is applied, and the data table updates to reflect the new entry.

---



### Backend
- **Payment APIs**:
  - Integrate with Stripe for secure transactions.
  - Support partial/full payments and automatic updates.
- **Database**:
  - Use PostgreSQL for structured storage:
    - Invoices, payments, balances, transaction histories.
- **Notifications**:
  - API to send payment updates via email or in-app messages.
- **Automation**:
  - Auto-calculate balances and handle refunds/overpayments.

## 6. Future Considerations
- Onboarding tools for easy data migration.
- AI-powered insights for financial forecasting and payment trends.

---

## 7. Success Metrics
- Secure client payments via Stripe with **90% success rate** during testing.
- Accurate manual payment logging by admins.
- Automated updates for balances and statuses.
- Positive user feedback on usability and efficiency.

## 8. Next Steps
- Implement functionalities for admin users first. We will then focus on client.
- 
- Start with the front-end implementation.
- Once the front-end is complete, we will proceed to the backend and database.
- Once the backend and database are set up, we will add notifications and automation.
- Stripe API Integrations for client payments will be 

## 9. Techinical Requirements
- Use Shadcn components (@components/ui) and Tailwind CSS for styling.

---

This document is intended as a living reference to inform development, testing, and future iterations of the **Billing Module**.