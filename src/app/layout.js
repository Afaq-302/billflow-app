import "@/styles/globals.css";

import Providers from "@/app/providers";

export const metadata = {
  title: "BillFlow Invoice Generator",
  description: "Create invoices, manage clients, and record payments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
