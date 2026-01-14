import { prisma } from "@/lib/prisma";
import { settingsDefaults } from "@/lib/settingsDefaults";

export async function getOrCreateSettings(userId) {
  const settings = await prisma.settings.findUnique({
    where: { userId },
  });

  if (settings) {
    return settings;
  }

  return prisma.settings.create({
    data: {
      userId,
      businessName: settingsDefaults.businessName,
      businessEmail: settingsDefaults.businessEmail,
      businessPhone: settingsDefaults.businessPhone,
      businessAddress: settingsDefaults.businessAddress,
      currencyDefault: settingsDefaults.currencyDefault,
      taxRateDefault: settingsDefaults.taxRateDefault,
      invoicePrefix: settingsDefaults.invoicePrefix,
      nextInvoiceNumber: settingsDefaults.nextInvoiceNumber,
      estimatePrefix: settingsDefaults.estimatePrefix,
      nextEstimateNumber: settingsDefaults.nextEstimateNumber,
      receiptPrefix: settingsDefaults.receiptPrefix,
      nextReceiptNumber: settingsDefaults.nextReceiptNumber,
      defaultPaymentTermsDays: settingsDefaults.defaultPaymentTermsDays,
      emailTemplates: settingsDefaults.emailTemplates,
      theme: settingsDefaults.theme,
    },
  });
}
