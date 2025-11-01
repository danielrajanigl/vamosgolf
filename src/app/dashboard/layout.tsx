"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = [
    { name: "Reisen", href: "/dashboard/reisen" },
    { name: "Preise", href: "/dashboard/preise" },
    { name: "Termine", href: "/dashboard/termine" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div className="text-2xl font-bold mb-8">VamosGolf</div>
        <nav className="flex flex-col gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded p-2 ${
                pathname.startsWith(l.href)
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {l.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
