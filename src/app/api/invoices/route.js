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

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}

export async function POST(request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    clientId,
    status,
    issueDate,
    dueDate,
    currency,
    taxRate,
    discount,
    lineItems,
    paymentLinkToken,
    notes,
    terms,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    paidTotal,
    balanceDue,
    sentAt,
  } = body || {};

  if (!clientId || !issueDate || !dueDate || !currency || !Array.isArray(lineItems)) {
    return NextResponse.json({ error: "Missing required invoice data" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const settings = await getOrCreateSettings(userId);
  const invoiceNumber = `${settings.invoicePrefix}${settings.nextInvoiceNumber}`;

  const [invoice, updatedSettings] = await prisma.$transaction([
    prisma.invoice.create({
      data: {
        userId,
        clientId,
        invoiceNumber,
        status: status || "Draft",
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        currency,
        taxRate,
        discount: discount ?? null,
        lineItems,
        paymentLinkToken: paymentLinkToken || null,
        notes: notes || null,
        terms: terms || null,
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        paidTotal,
        balanceDue,
        sentAt: sentAt ? new Date(sentAt) : null,
      },
    }),
    prisma.settings.update({
      where: { userId },
      data: { nextInvoiceNumber: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ invoice, settings: updatedSettings }, { status: 201 });
}
