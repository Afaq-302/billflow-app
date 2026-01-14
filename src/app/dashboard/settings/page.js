'use client';

import dynamic from "next/dynamic";

const SettingsPage = dynamic(() => import("@/views/app/Settings"), { ssr: false });

export default function SettingsRoute() {
  return <SettingsPage />;
}
