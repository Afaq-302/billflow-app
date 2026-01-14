export const settingsDefaults = {
  businessName: "Afaq - The Freelancer",
  businessEmail: "billing@billflow.com",
  businessPhone: "+1 (555) 123-4567",
  businessAddress: "123 Business Ave, Suite 100\nSan Francisco, CA 94102",
  currencyDefault: "USD",
  taxRateDefault: 10,
  invoicePrefix: "INV-",
  nextInvoiceNumber: 1001,
  estimatePrefix: "EST-",
  nextEstimateNumber: 101,
  receiptPrefix: "REC-",
  nextReceiptNumber: 501,
  defaultPaymentTermsDays: 30,
  emailTemplates: {
    invoice: {
      subject: "Invoice {{invoiceNumber}} from {{businessName}}",
      body: "Dear {{clientName}},\n\nPlease find attached invoice {{invoiceNumber}} for {{amount}}.\n\nPayment is due by {{dueDate}}.\n\nThank you for your business!\n\n{{businessName}}",
    },
    estimate: {
      subject: "Estimate {{estimateNumber}} from {{businessName}}",
      body: "Dear {{clientName}},\n\nPlease find attached estimate {{estimateNumber}} for {{amount}}.\n\nThis estimate is valid until {{validUntil}}.\n\nPlease let us know if you have any questions.\n\n{{businessName}}",
    },
    reminder: {
      subject: "Reminder: Invoice {{invoiceNumber}} is due",
      body: "Dear {{clientName}},\n\nThis is a friendly reminder that invoice {{invoiceNumber}} for {{amount}} is due on {{dueDate}}.\n\nPlease make payment at your earliest convenience.\n\nThank you!\n\n{{businessName}}",
    },
  },
  theme: "system",
};
