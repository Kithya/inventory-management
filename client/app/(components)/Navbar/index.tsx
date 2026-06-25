"use client";

import { Boxes, Menu } from "lucide-react";

const Navbar = ({
  onOpenMobileSidebar,
}: {
  onOpenMobileSidebar: () => void;
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <div className="shell-container flex items-center gap-3">
        <button
          aria-label="Open navigation"
          className="icon-button"
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="truncate font-semibold text-slate-900 dark:text-white">
            Inventory
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
