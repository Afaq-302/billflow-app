'use client';

import dynamic from "next/dynamic";

const InvoicesList = dynamic(() => import("@/views/app/invoices/InvoicesList"), { ssr: false });

export default function InvoicesPage() {
  return <InvoicesList />;
}
