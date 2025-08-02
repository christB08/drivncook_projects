"use client"
import { useEffect, useState } from "react"

export default function ApprovisionnementsPage() {
  const [appros, setAppros] = useState<any[]>([])
  const [franchises, setFranchises] = useState<any[]>([])
  const [entrepots, setEntrepots] = useState<any[]>([])
  const [form, setForm] = useState({ franchiseId: "", entrepotId: "", quantite: "", type: "" })
  const [error, setError] = useState<string>("")

  // Charger données
  const fetchAppros = async () => {
    const res = await fetch("/api/approvisionnements")
    setAppros(await res.json())
  }

  const fetchFranchises = async () => {
    const res = await fetch("/api/franchises")
    setFranchises(await res.json())
  }

  const fetchEntrepots = async () => {
    const res = await fetch("/api/entrepots")
    setEntrepots(await res.json())
  }

  useEffect(() => {
    fetchAppros()
    fetchFranchises()
    fetchEntrepots()
  }, [])

  // Ajouter approvisionnement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/approvisionnements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error)
      return
    }
    setForm({ franchiseId: "", entrepotId: "", quantite: "", type: "" })
    fetchAppros()
  }

  // Supprimer
  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer cet approvisionnement ?")) {
      await fetch("/api/approvisionnements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      fetchAppros()
    }
  }

  return (
    <div className="p-8 bg-black min-h-screen text-red-600">
      <h1 className="text-3xl font-bold mb-6">Gestion des Approvisionnements</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-5 gap-4 bg-gray-900 p-4 rounded border border-red-600">
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

        <select
          className="border border-red-600 bg-black text-red-600 p-2"
          value={form.entrepotId}
          onChange={(e) => setForm({ ...form, entrepotId: e.target.value })}
          required
        >
          <option value="">Choisir un entrepôt</option>
          {entrepots.map((e) => (
            <option key={e.id} value={e.id}>{e.ville}</option>
          ))}
        </select>

        <input
          className="border border-red-600 bg-black text-red-600 p-2"
          type="number"
          placeholder="Quantité"
          value={form.quantite}
          onChange={(e) => setForm({ ...form, quantite: e.target.value })}
          required
          min={1}
        />

        <select
          className="border border-red-600 bg-black text-red-600 p-2"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          required
        >
          <option value="">Type</option>
          <option value="LIBRE">Libre</option>
          <option value="PLANIFIE">Planifié</option>
          <option value="URGENT">Urgent</option>
          <option value="AUTOMATIQUE">Automatique</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Ajouter</button>
      </form>

      {/* Tableau */}
      <table className="w-full border border-red-600 text-red-600 bg-black">
        <thead>
          <tr className="bg-gray-900">
            <th className="border border-red-600 px-4 py-2">ID</th>
            <th className="border border-red-600 px-4 py-2">Franchise</th>
            <th className="border border-red-600 px-4 py-2">Entrepôt</th>
            <th className="border border-red-600 px-4 py-2">Quantité</th>
            <th className="border border-red-600 px-4 py-2">Type</th>
            <th className="border border-red-600 px-4 py-2">Date</th>
            <th className="border border-red-600 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appros.map((a) => (
            <tr key={a.id} className="hover:bg-gray-800">
              <td className="border border-red-600 px-4 py-2">{a.id}</td>
              <td className="border border-red-600 px-4 py-2">{a.franchise.nom}</td>
              <td className="border border-red-600 px-4 py-2">{a.entrepot.ville}</td>
              <td className="border border-red-600 px-4 py-2">{a.quantite}</td>
              <td className="border border-red-600 px-4 py-2">{a.type}</td>
              <td className="border border-red-600 px-4 py-2">{new Date(a.date).toLocaleDateString()}</td>
              <td className="border border-red-600 px-4 py-2">
                <button
                  onClick={() => handleDelete(a.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <a 
  href="/api/approvisionnements/pdf" 
  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mt-6 inline-block"
>
  📄 Télécharger Rapport Approvisionnements
</a>
    </div>
  )
}
