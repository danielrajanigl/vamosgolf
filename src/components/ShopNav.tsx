"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, ShoppingBag, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabaseBrowser } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export function ShopNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = supabaseBrowser()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">
              VamosGolf
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/reisen"
              className={`text-sm font-medium transition-colors ${
                isActive('/reisen') || pathname?.startsWith('/reisen')
                  ? 'text-sky-600'
                  : 'text-gray-700 hover:text-sky-600'
              }`}
            >
              Reisen
            </Link>
            <Link
              href="/shop"
              className={`text-sm font-medium transition-colors ${
                isActive('/shop')
                  ? 'text-sky-600'
                  : 'text-gray-700 hover:text-sky-600'
              }`}
            >
              Shop
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Anmelden
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t space-y-2">
            <Link
              href="/reisen"
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-600 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Reisen
            </Link>
            <Link
              href="/shop"
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-600 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-600 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

