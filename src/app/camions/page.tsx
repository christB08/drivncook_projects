"use client"
import { useEffect, useState, useRef } from "react"
import Chart from "chart.js/auto"

export default function CamionsPage() {
  const [camions, setCamions] = useState<any[]>([])
  const [franchises, setFranchises] = useState<any[]>([])
  const [form, setForm] = useState({ immatriculation: "", etat: "DISPONIBLE", franchiseId: "" })
  const [editId, setEditId] = useState<number | null>(null)
  const [selectedCamion, setSelectedCamion] = useState<any | null>(null)

  const chartRef = useRef<Chart | null>(null)

  const fetchCamions = async () => {
    const res = await fetch("/api/camions")
    setCamions(await res.json())
  }

  const fetchFranchises = async () => {
    const res = await fetch("/api/franchises")
    setFranchises(await res.json())
  }

  useEffect(() => {
    fetchCamions()
    fetchFranchises()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editId ? "PUT" : "POST"
    await fetch("/api/camions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editId }),
    })
    setForm({ immatriculation: "", etat: "DISPONIBLE", franchiseId: "" })
    setEditId(null)
    fetchCamions()
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer ce camion ?")) {
      await fetch("/api/camions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      fetchCamions()
    }
  }

  const handleEdit = (c: any) => {
    setEditId(c.id)
    setForm({ immatriculation: c.immatriculation, etat: c.etat, franchiseId: c.franchiseId })
  }

  // 📊 Stats camions
  const total = camions.length
  const dispo = camions.filter((c) => c.etat === "DISPONIBLE").length
  const panne = camions.filter((c) => c.etat === "EN_PANNE").length
  const entretien = camions.filter((c) => c.etat === "EN_ENTRETIEN").length

  useEffect(() => {
    if (total > 0) {
      const ctx = document.getElementById("camionsChart") as HTMLCanvasElement

      if (chartRef.current) {
        chartRef.current.destroy()
      }

      chartRef.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Disponibles", "En panne", "En entretien"],
          datasets: [
            {
              data: [dispo, panne, entretien],
              backgroundColor: ["#22c55e", "#ef4444", "#f97316"],
            },
          ],
        },
      })
    }
  }, [camions])

  return (
    <div className="p-8 bg-black min-h-screen text-red-600">
      <h1 className="text-3xl font-bold mb-6">Gestion des Camions</h1>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-3 gap-4 bg-gray-900 p-4 rounded border border-red-600">
        <input
          className="border border-red-600 bg-black text-red-600 p-2"
          placeholder="Immatriculation"
          value={form.immatriculation}
          onChange={(e) => setForm({ ...form, immatriculation: e.target.value })}
          required
        />
        <select
          className="border border-red-600 bg-black text-red-600 p-2"
          value={form.etat}
          onChange={(e) => setForm({ ...form, etat: e.target.value })}
        >
          <option value="DISPONIBLE">Disponible</option>
          <option value="EN_PANNE">En panne</option>
          <option value="EN_ENTRETIEN">En entretien</option>
        </select>
        <select
          className="border border-red-600 bg-black text-red-600 p-2"
          value={form.franchiseId}
          onChange={(e) => setForm({ ...form, franchiseId: e.target.value })}
          required
        >
          <option value="">Choisir une franchise</option>
          {franchises.map((f) => (
            <option key={f.id} value={f.id}>{f.nom}</option>
          ))}
        </select>
        <div className="col-span-3 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => { setEditId(null); setForm({ immatriculation: "", etat: "DISPONIBLE", franchiseId: "" }) }}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Tableau */}
      <table className="w-full border border-red-600 text-red-600 bg-black">
        <thead>
          <tr className="bg-gray-900">
            <th className="border border-red-600 px-4 py-2">ID</th>
            <th className="border border-red-600 px-4 py-2">Immatriculation</th>
            <th className="border border-red-600 px-4 py-2">État</th>
            <th className="border border-red-600 px-4 py-2">Franchise</th>
            <th className="border border-red-600 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {camions.map((c) => (
            <tr key={c.id} className="hover:bg-gray-800">
              <td className="border border-red-600 px-4 py-2">{c.id}</td>
              <td className="border border-red-600 px-4 py-2">{c.immatriculation}</td>
              <td className="border border-red-600 px-4 py-2">{c.etat}</td>
              <td className="border border-red-600 px-4 py-2">{c.franchise?.nom}</td>
              <td className="border border-red-600 px-4 py-2 flex gap-2 justify-center">
                <button onClick={() => handleEdit(c)} className="bg-yellow-500 text-white px-2 py-1 rounded">Modifier</button>
                <button onClick={() => handleDelete(c.id)} className="bg-red-500 text-white px-2 py-1 rounded">Supprimer</button>
                <button onClick={() => setSelectedCamion(c)} className="bg-blue-600 text-white px-2 py-1 rounded">Entretiens</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stats */}
      <div className="mt-8 bg-gray-900 border border-red-600 p-4 rounded">
        <h2 className="text-xl font-bold mb-4">Statistiques</h2>
        <p>Total camions : {total}</p>
        <p>Disponibles : {dispo}</p>
        <p>En panne : {panne}</p>
        <p>En entretien : {entretien}</p>
        <canvas id="camionsChart" className="mt-4"></canvas>
      </div>

      

      {/* Modal Entretiens */}
      {selectedCamion && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-gray-900 border border-red-600 p-6 rounded w-2/3 shadow-lg text-red-600">
            <h2 className="text-2xl font-bold mb-4">
              Entretiens du camion {selectedCamion.immatriculation}
            </h2>

            <ul className="list-disc ml-6">
              {selectedCamion.entretiens?.map((e: any) => (
                <li key={e.id}>
                  {new Date(e.date).toLocaleDateString()} - {e.type} ({e.details || "Pas de détails"})
                </li>
              ))}
            </ul>

            <form
              onSubmit={async (ev) => {
                ev.preventDefault()
                const formData = new FormData(ev.currentTarget as HTMLFormElement)
                await fetch("/api/entretiens", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    camionId: selectedCamion.id,
                    type: formData.get("type"),
                    details: formData.get("details"),
                  }),
                })
                setSelectedCamion(null)
                fetchCamions()
              }}
              className="mt-4 space-y-2"
            >
              <input name="type" placeholder="Type d'entretien" className="border border-red-600 bg-black text-red-600 p-2 w-full" required />
              <input name="details" placeholder="Détails" className="border border-red-600 bg-black text-red-600 p-2 w-full" />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Ajouter entretien</button>
            </form>

            <button onClick={() => setSelectedCamion(null)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
