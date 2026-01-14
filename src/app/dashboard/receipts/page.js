'use client';

import dynamic from "next/dynamic";

const ReceiptsList = dynamic(() => import("@/views/app/receipts/ReceiptsList"), { ssr: false });

export default function ReceiptsPage() {
  return <ReceiptsList />;
}
