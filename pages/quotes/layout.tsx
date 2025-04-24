import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

type QuotesLayoutProps = {
  children: ReactNode
}

export default function QuotesLayout({ children }: QuotesLayoutProps) {
  const router = useRouter()

  const navItems = [
    { href: '/quotes', label: 'All Quotes' },
    { href: '/quotes/books', label: 'Books' },
    { href: '/quotes/authors', label: 'Authors' },
    { href: '/quotes/upload', label: 'Upload' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-xl font-bold mb-4 sm:mb-0">
              <Link href="/quotes" className="text-blue-600 hover:text-blue-800">
                Quotes Library
              </Link>
            </h1>

            <nav className="flex space-x-6">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    } pb-1`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
