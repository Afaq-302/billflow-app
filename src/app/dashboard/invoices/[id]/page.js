'use client';

import * as React from "react";
import dynamic from "next/dynamic";

const InvoiceDetail = dynamic(() => import("@/views/app/invoices/InvoiceDetail"), {
  ssr: false,
});

export default function InvoiceDetailPage({ params }) {
  const { id } = React.use(params); // ✅ unwrap the Promise
  return <InvoiceDetail invoiceId={id} />;
}
