import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const passwordPolicy = /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,}$/;

export async function POST(request) {
  const { name, email, phone, businessName, businessAddress, password } = await request.json();

  if (!name?.trim() || !email || !phone?.trim()) {
    return NextResponse.json({ error: "Full name, email, and phone number are required." }, { status: 400 });
  }

  if (!passwordPolicy.test(password ?? "")) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters and include a number and special character." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const resolvedBusinessName = businessName?.trim() || name.trim();
  const resolvedBusinessAddress = businessAddress?.trim() || "";

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
    },
  });

  await prisma.settings.create({
    data: {
      userId: user.id,
      businessName: resolvedBusinessName,
      businessEmail: normalizedEmail,
      businessPhone: phone.trim(),
      businessAddress: resolvedBusinessAddress,
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
    },
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
