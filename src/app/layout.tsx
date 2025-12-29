import './globals.css'
import { ShopNav } from '@/components/ShopNav'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <ShopNav />
        {children}
      </body>
    </html>
  )
}
