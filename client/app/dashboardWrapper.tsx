"use client";
import React, { useEffect, useState } from "react";
import { InventoryAuthProvider } from "./auth";
import Navbar from "./(components)/Navbar";
import Sidebar from "./(components)/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";
import { usePathname } from "next/navigation";

const publicAuthPaths = ["/login", "/accept-invite", "/forgot-password", "/reset-password"];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const theme = useAppSelector((state) => state.global.theme ?? "system");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const shouldUseDark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", shouldUseDark);
    };

    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileSidebarOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  if (publicAuthPaths.some((path) => pathname.startsWith(path))) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <main
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <Navbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="shell-container">{children}</div>
        </div>
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <InventoryAuthProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </InventoryAuthProvider>
    </StoreProvider>
  );
};

export default DashboardWrapper;
