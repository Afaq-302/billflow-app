import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/serverSettings";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getOrCreateSettings(userId);
  return NextResponse.json({ settings });
}

export async function PUT(request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await getOrCreateSettings(userId);
  const settings = await prisma.settings.update({
    where: { userId },
    data: {
      businessName: body.businessName,
      businessEmail: body.businessEmail,
      businessPhone: body.businessPhone,
      businessAddress: body.businessAddress,
      currencyDefault: body.currencyDefault,
      taxRateDefault: body.taxRateDefault,
      invoicePrefix: body.invoicePrefix,
      nextInvoiceNumber: body.nextInvoiceNumber,
      estimatePrefix: body.estimatePrefix,
      nextEstimateNumber: body.nextEstimateNumber,
      receiptPrefix: body.receiptPrefix,
      nextReceiptNumber: body.nextReceiptNumber,
      defaultPaymentTermsDays: body.defaultPaymentTermsDays,
      emailTemplates: body.emailTemplates,
      theme: body.theme,
    },
  });

  return NextResponse.json({ settings });
}
