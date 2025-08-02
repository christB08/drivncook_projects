"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    // Plein écran, pas de sidebar
    return <main className="min-h-screen flex items-center justify-center w-full">{children}</main>
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-8">Driv'n Cook</h1>
        <nav className="flex flex-col gap-4">
          <Link href="/" className="hover:bg-gray-700 p-2 rounded">
            🏠 Accueil
          </Link>
          <Link href="/franchises" className="hover:bg-gray-700 p-2 rounded">
            🏪 Franchises
          </Link>
          <Link href="/camions" className="hover:bg-gray-700 p-2 rounded">
            🚚 Camions
          </Link>
          <Link href="/entrepots" className="hover:bg-gray-700 p-2 rounded">
            🏬 Entrepôts
          </Link>
          <Link href="/ventes" className="hover:bg-gray-700 p-2 rounded">
            💶 Ventes
          </Link>
          <Link href="/approvisionnements" className="hover:bg-gray-700 p-2 rounded">
            📦 Approvisionnements
          </Link>
          <form action="/api/logout" method="post">
            <button className="bg-red-600 p-2 rounded mt-4 w-full">
              🚪 Déconnexion
            </button>
          </form>
        </nav>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
