import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export async function GET(request, { params }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PUT(request, { params }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.invoice.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    status,
    issueDate,
    dueDate,
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
    lastReminderAt,
  } = body || {};

  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      status: status ?? existing.status,
      issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
      dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
      taxRate: taxRate ?? existing.taxRate,
      discount: discount ?? existing.discount,
      lineItems: Array.isArray(lineItems) ? lineItems : existing.lineItems,
      paymentLinkToken: paymentLinkToken ?? existing.paymentLinkToken,
      notes: notes ?? existing.notes,
      terms: terms ?? existing.terms,
      subtotal: subtotal ?? existing.subtotal,
      taxTotal: taxTotal ?? existing.taxTotal,
      discountTotal: discountTotal ?? existing.discountTotal,
      grandTotal: grandTotal ?? existing.grandTotal,
      paidTotal: paidTotal ?? existing.paidTotal,
      balanceDue: balanceDue ?? existing.balanceDue,
      sentAt: sentAt ? new Date(sentAt) : existing.sentAt,
      lastReminderAt: lastReminderAt ? new Date(lastReminderAt) : existing.lastReminderAt,
    },
  });

  return NextResponse.json({ invoice });
}

export async function DELETE(request, { params }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.receipt.deleteMany({ where: { userId, invoiceId: invoice.id } });
  await prisma.payment.deleteMany({ where: { userId, invoiceId: invoice.id } });
  await prisma.reminderLog.deleteMany({ where: { userId, invoiceId: invoice.id } });
  await prisma.invoice.delete({ where: { id: invoice.id } });

  return NextResponse.json({ success: true });
}
