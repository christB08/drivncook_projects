"use client"
import { useEffect, useState } from "react"

export default function EntrepotsPage() {
  const [entrepots, setEntrepots] = useState<any[]>([])
  const [form, setForm] = useState({ ville: "", stockTotal: "", stockUtilise: "" })
  const [editId, setEditId] = useState<number | null>(null)
  const [error, setError] = useState<string>("")

  // 🔄 Charger la liste
  const fetchEntrepots = async () => {
    try {
      const res = await fetch("/api/entrepots")
      if (!res.ok) throw new Error("Erreur API")
      const data = await res.json()
      setEntrepots(data)
    } catch (err) {
      console.error("Erreur fetchEntrepots:", err)
      setError("Impossible de charger les entrepôts")
    }
  }

  useEffect(() => { fetchEntrepots() }, [])

  // ➕ Ajouter ou modifier
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const stockTotalNum = parseInt(form.stockTotal)
    const stockUtiliseNum = parseInt(form.stockUtilise)

    // Vérif front
    if (isNaN(stockTotalNum) || isNaN(stockUtiliseNum)) {
      setError("Veuillez entrer des nombres valides.")
      return
    }

    if (stockUtiliseNum > stockTotalNum) {
      setError("Le stock utilisé ne peut pas dépasser le stock total.")
      return
    }

    const method = editId ? "PUT" : "POST"

    try {
      const res = await fetch("/api/entrepots", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'enregistrement")
        return
      }

      setForm({ ville: "", stockTotal: "", stockUtilise: "" })
      setEditId(null)
      fetchEntrepots()
    } catch (err) {
      console.error("Erreur handleSubmit:", err)
      setError("Erreur lors de l'enregistrement")
    }
  }

  // 🗑️ Supprimer
  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer cet entrepôt ?")) {
      await fetch("/api/entrepots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      fetchEntrepots()
    }
  }

  // ✏️ Modifier
  const handleEdit = (e: any) => {
    setEditId(e.id)
    setForm({
      ville: e.ville,
      stockTotal: e.stockTotal.toString(),
      stockUtilise: e.stockUtilise.toString(),
    })
  }

  return (
    <div className="p-8 bg-black min-h-screen text-red-600">
      <h1 className="text-3xl font-bold mb-6">Gestion des Entrepôts</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-4 gap-4 bg-gray-900 p-4 rounded border border-red-600"
      >
        <input
          className="border border-red-600 bg-black text-red-600 p-2"
          placeholder="Ville"
          value={form.ville}
          onChange={(e) => setForm({ ...form, ville: e.target.value })}
          required
        />
        <input
          className="border border-red-600 bg-black text-red-600 p-2"
          type="number"
          placeholder="Stock Total"
          value={form.stockTotal}
          onChange={(e) => setForm({ ...form, stockTotal: e.target.value })}
          required
          min={0}
        />
        <input
          className="border border-red-600 bg-black text-red-600 p-2"
          type="number"
          placeholder="Stock Utilisé"
          value={form.stockUtilise}
          onChange={(e) => setForm({ ...form, stockUtilise: e.target.value })}
          required
          min={0}
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null)
                setForm({ ville: "", stockTotal: "", stockUtilise: "" })
              }}
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
            <th className="border border-red-600 px-4 py-2">Ville</th>
            <th className="border border-red-600 px-4 py-2">Stock Total</th>
            <th className="border border-red-600 px-4 py-2">Stock Utilisé</th>
            <th className="border border-red-600 px-4 py-2">Progression</th>
            <th className="border border-red-600 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entrepots.map((e) => {
            const pourcentage = e.stockTotal > 0
              ? Math.min(100, Math.round((e.stockUtilise / e.stockTotal) * 100))
              : 0

            return (
              <tr key={e.id} className="hover:bg-gray-800">
                <td className="border border-red-600 px-4 py-2">{e.id}</td>
                <td className="border border-red-600 px-4 py-2">{e.ville}</td>
                <td className="border border-red-600 px-4 py-2">{e.stockTotal}</td>
                <td className="border border-red-600 px-4 py-2">{e.stockUtilise}</td>
                <td className="border border-red-600 px-4 py-2">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-green-600"
                      style={{ width: `${pourcentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{pourcentage}%</span>
                </td>
                <td className="border border-red-600 px-4 py-2 flex gap-2 justify-center">
                  <button
                    onClick={() => handleEdit(e)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {/* Bouton PDF */}
<a
  href="/api/entrepots/pdf"
  className="bg-purple-600 text-white px-4 py-2 rounded mt-6 inline-block"
>
  Télécharger PDF Entrepôts
</a>

    </div>
  )
}
