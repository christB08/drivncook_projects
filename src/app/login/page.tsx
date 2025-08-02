"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [motDePasse, setMotDePasse] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    })

    if (res.ok) {
      router.push("/")
    } else {
      const err = await res.json()
      setError(err.error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Colonne gauche */}
      <div className="hidden md:flex flex-1 bg-blue-600 text-white items-center justify-center flex-col">
        <h1 className="text-6xl font-extrabold mb-6">Driv'n Cook</h1>
        <p className="text-xl text-gray-100">
          Gérez facilement votre réseau 🚚🍔
        </p>
      </div>

      {/* Colonne droite (formulaire élargi et aligné à droite) */}
      <div className="flex flex-1 items-center justify-center bg-gray-800 p-10">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-12 rounded-2xl shadow-2xl w-full max-w-lg ml-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-white">
            Connexion
          </h2>

          {error && (
            <p className="bg-red-100 text-red-600 p-2 rounded mb-4 text-center">
              {error}
            </p>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-600 bg-gray-800 text-white p-4 rounded-lg mb-5 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            className="w-full border border-gray-600 bg-gray-800 text-white p-4 rounded-lg mb-8 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg text-lg transition-all"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
