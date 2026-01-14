'use client';

import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/views/app/Dashboard"), { ssr: false });

export default function AppDashboardPage() {
  return <Dashboard />;
}
