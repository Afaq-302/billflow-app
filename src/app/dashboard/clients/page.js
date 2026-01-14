'use client';

import dynamic from "next/dynamic";

const ClientsList = dynamic(() => import("@/views/app/clients/ClientsList"), { ssr: false });

export default function ClientsPage() {
  return <ClientsList />;
}
