import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/serverSettings";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export async function POST(request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invoiceId, clientId, amount, method, date, reference, note } = body || {};

  if (!invoiceId || !clientId || !amount || !method || !date) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice || invoice.clientId !== clientId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const amountValue = Number(amount);
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }
  if (invoice.balanceDue <= 0) {
    return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
  }
  if (amountValue > invoice.balanceDue) {
    return NextResponse.json({ error: "Amount exceeds balance due" }, { status: 400 });
  }

  const paidTotal = invoice.paidTotal + amountValue;
  const balanceDue = Math.max(0, invoice.grandTotal - paidTotal);
  let status = invoice.status;

  if (balanceDue <= 0) {
    status = "Paid";
  } else if (paidTotal > 0) {
    status = "Partially Paid";
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      invoiceId,
      clientId,
      amount: amountValue,
      method,
      date: new Date(date),
      reference: reference || null,
      note: note || null,
    },
  });

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paidTotal,
      balanceDue,
      status,
      updatedAt: new Date(),
    },
  });

  const settings = await getOrCreateSettings(userId);
  const receiptNumber = `${settings.receiptPrefix}${settings.nextReceiptNumber}`;

  const receipt = await prisma.receipt.create({
    data: {
      userId,
      receiptNumber,
      invoiceId,
      paymentId: payment.id,
      clientId,
      issuedAt: new Date(date),
      amount: amountValue,
      currency: invoice.currency,
    },
  });

  const updatedSettings = await prisma.settings.update({
    where: { userId },
    data: { nextReceiptNumber: { increment: 1 } },
  });

  return NextResponse.json({
    payment,
    invoice: updatedInvoice,
    receipt,
    settings: updatedSettings,
  });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ payments });
}
