'use client';

import dynamic from "next/dynamic";

const AppLayout = dynamic(() => import("@/components/layout/AppLayout"), { ssr: false });

export default function AppRouteLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}
