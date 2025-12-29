"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ReactNode } from "react";

type NavItem = { href: string; label: string };

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r bg-white">
          <div className="px-4 py-5 font-bold text-emerald-600 text-xl">
            VamosGolf
          </div>
          <nav className="px-2 pb-6 space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block rounded-md px-3 py-2 text-sm",
                    active
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
            <div className="mx-auto max-w-6xl px-6 py-4">
              <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
