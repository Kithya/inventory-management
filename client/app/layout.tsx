import type { Metadata } from "next";
import "./globals.css";
import DashboardWrapper from "./dashboardWrapper";

export const metadata: Metadata = {
  title: {
    default: "Inventory",
    template: "%s | Inventory",
  },
  description: "Inventory operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <DashboardWrapper>{children}</DashboardWrapper>
      </body>
    </html>
  );
}
