"use client";

import { useInventoryAuth } from "@/app/auth";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  Archive,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogIn,
  LogOut,
  type LucideIcon,
  PackageSearch,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
  onNavigate: () => void;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
  onNavigate,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={`group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
        isCollapsed ? "lg:justify-center lg:px-0" : ""
      } ${
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
      href={href}
      onClick={onNavigate}
      title={isCollapsed ? label : undefined}
    >
      {isActive ? (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-blue-600 dark:bg-blue-400" />
      ) : null}
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className={isCollapsed ? "lg:sr-only" : "truncate"}>{label}</span>
    </Link>
  );
};

const Sidebar = ({
  isMobileOpen,
  onMobileClose,
}: {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { isAdmin, isAuthConfigured, userName, login, logout } = useInventoryAuth();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );

  useEffect(() => {
    if (!isMobileOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  return (
    <>
      {isMobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 border-r border-slate-200 bg-white transition-[width,transform] duration-200 dark:border-slate-800 dark:bg-slate-900 ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        ref={sidebarRef}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={`flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800 ${
              isSidebarCollapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <Boxes className="h-5 w-5" />
            </div>
            <div
              className={`min-w-0 ${isSidebarCollapsed ? "lg:hidden" : ""}`}
            >
              <p className="truncate font-bold tracking-tight text-slate-950 dark:text-white">
                Inventory
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Operations
              </p>
            </div>
            <button
              aria-label="Close navigation"
              className="icon-button ml-auto border-0 bg-transparent lg:hidden dark:bg-transparent"
              onClick={onMobileClose}
              ref={closeButtonRef}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col px-3 py-4">
            <p
              className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${
                isSidebarCollapsed ? "lg:sr-only" : ""
              }`}
            >
              Workspace
            </p>
            <div className="space-y-1">
              <SidebarLink
                href="/dashboard"
                icon={LayoutDashboard}
                isCollapsed={isSidebarCollapsed}
                label="Dashboard"
                onNavigate={onMobileClose}
              />
              <SidebarLink
                href="/inventory"
                icon={Archive}
                isCollapsed={isSidebarCollapsed}
                label="Inventory"
                onNavigate={onMobileClose}
              />
              <SidebarLink
                href="/products"
                icon={PackageSearch}
                isCollapsed={isSidebarCollapsed}
                label="Products"
                onNavigate={onMobileClose}
              />
              {isAdmin ? (
                <SidebarLink
                  href="/users"
                  icon={Users}
                  isCollapsed={isSidebarCollapsed}
                  label="Users"
                  onNavigate={onMobileClose}
                />
              ) : null}
              <SidebarLink
                href="/expenses"
                icon={CircleDollarSign}
                isCollapsed={isSidebarCollapsed}
                label="Expenses"
                onNavigate={onMobileClose}
              />
            </div>
          </nav>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div
              className={`mb-2 px-3 text-xs text-slate-500 dark:text-slate-400 ${
                isSidebarCollapsed ? "lg:sr-only" : ""
              }`}
            >
              <p className="truncate font-semibold text-slate-700 dark:text-slate-200">
                {userName}
              </p>
              <p className="truncate">
                {isAdmin ? "Administrator" : "Workspace user"}
              </p>
            </div>
            <SidebarLink
              href="/settings"
              icon={SlidersHorizontal}
              isCollapsed={isSidebarCollapsed}
              label="Settings"
              onNavigate={onMobileClose}
            />
            <button
              className={`button-ghost mt-1 hidden w-full lg:flex ${
                isSidebarCollapsed ? "px-0" : "justify-start"
              }`}
              onClick={() =>
                dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))
              }
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              {isSidebarCollapsed ? null : <span>Collapse sidebar</span>}
            </button>
            {isAuthConfigured ? (
              <button
                className={`button-ghost mt-1 w-full ${
                  isSidebarCollapsed ? "lg:px-0" : "justify-start"
                }`}
                onClick={logout}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                {isSidebarCollapsed ? null : <span>Sign out</span>}
              </button>
            ) : (
              <button
                className={`button-ghost mt-1 w-full ${
                  isSidebarCollapsed ? "lg:px-0" : "justify-start"
                }`}
                disabled
                onClick={login}
                title="Auth disabled for local development"
              >
                <LogIn className="h-4 w-4" />
                {isSidebarCollapsed ? null : <span>Local auth</span>}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
