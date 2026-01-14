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

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PUT(request, { params }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, phone, address, notes } = body || {};

  const existing = await prisma.client.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name,
      email,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ client });
}

export async function DELETE(request, { params }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.receipt.deleteMany({ where: { userId, clientId: client.id } });
  await prisma.payment.deleteMany({ where: { userId, clientId: client.id } });
  await prisma.invoice.deleteMany({ where: { userId, clientId: client.id } });
  await prisma.reminderLog.deleteMany({ where: { userId, clientId: client.id } });
  await prisma.client.delete({ where: { id: client.id } });

  return NextResponse.json({ success: true });
}
