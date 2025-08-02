"use client"
import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA46BE"]

export default function HomePage() {
  const [data, setData] = useState<any>(null)
  const [caParFranchise, setCaParFranchise] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))

    fetch("/api/stats/ca-par-franchise")
      .then((res) => res.json())
      .then((d) => setCaParFranchise(d))
  }, [])

  if (!data) return <p className="p-8">Chargement...</p>

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Tableau de Bord Driv'n Cook</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
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
      </div>

      <div className="mt-8 bg-purple-700 text-white rounded-xl p-6 shadow-lg text-center mb-10">
        <h2 className="text-xl">Commission Totale (4%)</h2>
        <p className="text-3xl font-bold">{data.commission.toFixed(2)} €</p>
      </div>

      {/* Camembert */}
      <div className="flex justify-center">
        <PieChart width={500} height={400}>
          <Pie
            data={caParFranchise}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label
          >
            {caParFranchise.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  )
}
