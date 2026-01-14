'use client';

import dynamic from "next/dynamic";

const InvoiceNew = dynamic(() => import("@/views/app/invoices/InvoiceNew"), { ssr: false });

export default function InvoiceNewPage() {
  return <InvoiceNew />;
}
