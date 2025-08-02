"use client"
import { useEffect, useState } from "react"

export default function VentesPage() {
  const [ventes, setVentes] = useState<any[]>([])
  const [franchises, setFranchises] = useState<any[]>([])
  const [form, setForm] = useState({ montant: "", franchiseId: "", date: "" })
  const [editId, setEditId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtreFranchise, setFiltreFranchise] = useState("")
  const [filtreDate, setFiltreDate] = useState("")
  const [error, setError] = useState("")

  const fetchVentes = async () => {
    const res = await fetch("/api/ventes")
    setVentes(await res.json())
  }

  const fetchFranchises = async () => {
    const res = await fetch("/api/franchises")
    setFranchises(await res.json())
  }

  useEffect(() => {
    fetchVentes()
    fetchFranchises()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const method = editId ? "PUT" : "POST"
    const res = await fetch("/api/ventes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, ...form, montant: parseFloat(form.montant) }),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error)
      return
    }
    setForm({ montant: "", franchiseId: "", date: "" })
    setEditId(null)
    fetchVentes()
  }

  const handleEdit = (v: any) => {
    setEditId(v.id)
    setForm({
      montant: v.montant.toString(),
      franchiseId: v.franchiseId.toString(),
      date: v.date.split("T")[0],
    })
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer cette vente ?")) {
      await fetch("/api/ventes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      fetchVentes()
    }
  }

  // 🔍 Filtres
  const filteredVentes = ventes
    .filter((v) =>
      v.franchise.nom.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((v) =>
      filtreFranchise ? v.franchiseId == parseInt(filtreFranchise) : true
    )
    .filter((v) =>
      filtreDate ? v.date.startsWith(filtreDate) : true
    )

  // 📊 Stats
  const total = filteredVentes.reduce((sum, v) => sum + v.montant, 0)
  const commission = total * 0.04
  const maxVente = filteredVentes.length > 0 ? Math.max(...filteredVentes.map(v => v.montant)) : 0
  const minVente = filteredVentes.length > 0 ? Math.min(...filteredVentes.map(v => v.montant)) : 0
  const moyenne = filteredVentes.length > 0 ? total / filteredVentes.length : 0

  return (
    <div className="p-8 bg-black min-h-screen text-red-600">
      <h1 className="text-3xl font-bold mb-6">Gestion des Ventes</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-3 gap-4 bg-gray-900 p-4 rounded border border-red-600">
        <input
          className="border border-red-600 bg-black text-red-600 p-2"
          type="number"
          step="0.01"
          placeholder="Montant (€)"
          value={form.montant}
          onChange={(e) => setForm({ ...form, montant: e.target.value })}
          required
        />
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
        <input
          className="border border-red-600 bg-black text-red-600 p-2"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />

        <div className="col-span-3 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm({ montant: "", franchiseId: "", date: "" }) }}
              className="bg-gray-500 text-white px-4 py-2 rounded">
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Filtres */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Recherche franchise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-red-600 bg-black text-red-600 rounded flex-1"
        />
        <select
          value={filtreFranchise}
          onChange={(e) => setFiltreFranchise(e.target.value)}
          className="p-2 border border-red-600 bg-black text-red-600"
        >
          <option value="">Toutes les franchises</option>
          {franchises.map((f) => (
            <option key={f.id} value={f.id}>{f.nom}</option>
          ))}
        </select>
        <input
          type="month"
          value={filtreDate}
          onChange={(e) => setFiltreDate(e.target.value)}
          className="p-2 border border-red-600 bg-black text-red-600"
        />
      </div>

      {/* Tableau */}
      <table className="w-full border border-red-600 text-red-600 bg-black">
        <thead>
          <tr className="bg-gray-900">
            <th className="border border-red-600 px-4 py-2">ID</th>
            <th className="border border-red-600 px-4 py-2">Date</th>
            <th className="border border-red-600 px-4 py-2">Montant</th>
            <th className="border border-red-600 px-4 py-2">Franchise</th>
            <th className="border border-red-600 px-4 py-2">Commission (4%)</th>
            <th className="border border-red-600 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredVentes.map((v) => (
            <tr key={v.id} className="hover:bg-gray-800">
              <td className="border border-red-600 px-4 py-2">{v.id}</td>
              <td className="border border-red-600 px-4 py-2">{new Date(v.date).toLocaleDateString()}</td>
              <td className="border border-red-600 px-4 py-2">{v.montant} €</td>
              <td className="border border-red-600 px-4 py-2">{v.franchise.nom}</td>
              <td className="border border-red-600 px-4 py-2">{(v.montant * 0.04).toFixed(2)} €</td>
              <td className="border border-red-600 px-4 py-2 flex gap-2 justify-center">
                <button onClick={() => handleEdit(v)} className="bg-yellow-500 text-white px-2 py-1 rounded">Modifier</button>
                <button onClick={() => handleDelete(v.id)} className="bg-red-500 text-white px-2 py-1 rounded">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Stats */}
      <div className="mt-6 font-bold">
        <p>Total des ventes : {total.toFixed(2)} €</p>
        <p>Commission totale (4%) : {commission.toFixed(2)} €</p>
        <p>Vente max : {maxVente.toFixed(2)} €</p>
        <p>Vente min : {minVente.toFixed(2)} €</p>
        <p>Moyenne par vente : {moyenne.toFixed(2)} €</p>
      </div>

      {/* PDF */}
      <a href="/api/ventes/pdf" className="bg-green-600 text-white px-4 py-2 rounded mt-4 inline-block">
        Télécharger PDF des ventes
      </a>
    </div>
  )
}
