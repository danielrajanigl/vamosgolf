"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardNavProps {
  userRole: string
}

export default function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname()
  
  const links = [
    { name: "Übersicht", href: "/dashboard" },
    { name: "Reisen", href: "/dashboard/reisen" },
    { name: "Termine", href: "/dashboard/termine" },
  ]

  const adminLinks = userRole === "admin" ? [
    { name: "Buchungen", href: "/dashboard/buchungen" },
    { name: "Kunden", href: "/dashboard/kunden" },
  ] : []

  const allLinks = [...links, ...adminLinks]

  return (
    <nav className="flex flex-col gap-1">
      {allLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`
              rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${isActive 
                ? "bg-emerald-50 text-emerald-700" 
                : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            {link.name}
          </Link>
        )
      })}
    </nav>
  )
}
