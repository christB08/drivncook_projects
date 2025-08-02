"use client"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
  }, [])

  if (!data) return <p>Chargement...</p>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tableau de Bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-600 text-white rounded-xl p-6 shadow-lg text-center">
          <h2 className="text-xl">Franchises</h2>
          <p className="text-3xl font-bold">{data.franchisesCount}</p>
        </div>

        <div className="bg-green-600 text-white rounded-xl p-6 shadow-lg text-center">
          <h2 className="text-xl">Camions</h2>
          <p className="text-3xl font-bold">{data.camionsCount}</p>
        </div>

        <div className="bg-yellow-500 text-white rounded-xl p-6 shadow-lg text-center">
          <h2 className="text-xl">Entrepôts</h2>
          <p className="text-3xl font-bold">{data.entrepotsCount}</p>
        </div>

        <div className="bg-red-600 text-white rounded-xl p-6 shadow-lg text-center">
          <h2 className="text-xl">Chiffre d'Affaires</h2>
          <p className="text-3xl font-bold">{data.totalCA.toFixed(2)} €</p>
        </div>

        <div className="bg-purple-700 text-white rounded-xl p-6 shadow-lg text-center col-span-full">
          <h2 className="text-xl">Commission Totale (4%)</h2>
          <p className="text-3xl font-bold">{data.commission.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  )
}
