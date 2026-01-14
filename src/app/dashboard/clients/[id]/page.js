'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ClientDetail = dynamic(
  () => import('@/views/app/clients/ClientDetail'),
  { ssr: false }
);

export default function ClientDetailPage({ params }) {
  const { id } = React.use(params);

  return <ClientDetail clientId={id} />;
}
