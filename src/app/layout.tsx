import "./globals.css"
import ClientLayout from "./ClientLayout"

export const metadata = {
  title: "Driv'n Cook Dashboard",
  description: "Gestion du réseau Driv'n Cook",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-100 text-gray-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
