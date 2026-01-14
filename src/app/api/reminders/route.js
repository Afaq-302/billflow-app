import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

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
  const { invoiceId, clientId, type, channel, subject, message, sentAt } = body || {};

  if (!invoiceId || !clientId || !type || !channel || !subject || !message) {
    return NextResponse.json({ error: "Missing reminder details" }, { status: 400 });
  }

  const reminderLog = await prisma.reminderLog.create({
    data: {
      userId,
      invoiceId,
      clientId,
      type,
      channel,
      subject,
      message,
      sentAt: sentAt ? new Date(sentAt) : new Date(),
    },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { lastReminderAt: reminderLog.sentAt },
  });

  return NextResponse.json({ reminderLog }, { status: 201 });
}
