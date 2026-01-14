'use client';

import dynamic from "next/dynamic";

const PaymentPage = dynamic(() => import("@/views/PaymentPage"), { ssr: false });

export default function PaymentRoute({ params }) {
  return <PaymentPage paymentToken={params.paymentToken} />;
}
