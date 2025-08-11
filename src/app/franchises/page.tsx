"use client";
import { useEffect, useState } from "react";

export default function FranchisesPage() {
  const initialFormState = {
    // existants
    nom: "",
    adresse: "",
    droitEntree: "",
    contactNom: "",
    contactEmail: "",
    contactTelephone: "",
    dateCreation: new Date().toISOString().split("T")[0],
    statut: "ACTIF",

    // 🔥 nouveaux champs (optionnels)
    ville: "",
    codePostal: "",
    pays: "France",
    formeJuridique: "",
    siret: "",
    tvaIntracom: "",
    capitalSocial: "",
    iban: "",
    contactFactNom: "",
    contactFactEmail: "",
    contactFactTelephone: "",
    kbisUrl: "",
    idCardUrl: "",
    proofAddressUrl: "",
    ribUrl: "",
  };

  const [franchises, setFranchises] = useState<any[]>([]);
  const [form, setForm] = useState(initialFormState);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedFranchise, setSelectedFranchise] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchFranchises = async () => {
    const res = await fetch("/api/franchises");
    setFranchises(await res.json());
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) return "Email de contact invalide.";
    if (form.siret && !/^\d{14}$/.test(form.siret)) return "SIRET invalide (14 chiffres).";
    if (form.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(form.iban)) return "IBAN invalide.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const v = validate();
    if (v) return setErr(v);

    const method = editId ? "PUT" : "POST";

    // mappe les champs, convertit les nombres, met null pour les optionnels vides
    const payload = {
      id: editId,
      nom: form.nom,
      adresse: form.adresse || null,
      droitEntree: parseFloat(String(form.droitEntree)),
      contactNom: form.contactNom,
      contactEmail: form.contactEmail,
      contactTelephone: form.contactTelephone,
      dateCreation: form.dateCreation,
      statut: form.statut,

      ville: form.ville || null,
      codePostal: form.codePostal || null,
      pays: form.pays || null,
      formeJuridique: form.formeJuridique || null,
      siret: form.siret || null,
      tvaIntracom: form.tvaIntracom || null,
      capitalSocial: form.capitalSocial ? parseFloat(String(form.capitalSocial)) : null,
      iban: form.iban || null,

      contactFactNom: form.contactFactNom || null,
      contactFactEmail: form.contactFactEmail || null,
      contactFactTelephone: form.contactFactTelephone || null,

      kbisUrl: form.kbisUrl || null,
      idCardUrl: form.idCardUrl || null,
      proofAddressUrl: form.proofAddressUrl || null,
      ribUrl: form.ribUrl || null,
    };

    await fetch("/api/franchises", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setForm(initialFormState);
    setEditId(null);
    fetchFranchises();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer cette franchise ?")) {
      await fetch("/api/franchises", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchFranchises();
    }
  };

  const handleEdit = (f: any) => {
    setEditId(f.id);
    setForm({
      nom: f.nom ?? "",
      adresse: f.adresse ?? "",
      droitEntree: f.droitEntree?.toString() ?? "",
      contactNom: f.contactNom ?? "",
      contactEmail: f.contactEmail ?? "",
      contactTelephone: f.contactTelephone ?? "",
      dateCreation: f.dateCreation ? f.dateCreation.split("T")[0] : new Date().toISOString().split("T")[0],
      statut: f.statut ?? "ACTIF",

      ville: f.ville ?? "",
      codePostal: f.codePostal ?? "",
      pays: f.pays ?? "France",
      formeJuridique: f.formeJuridique ?? "",
      siret: f.siret ?? "",
      tvaIntracom: f.tvaIntracom ?? "",
      capitalSocial: f.capitalSocial?.toString?.() ?? "",
      iban: f.iban ?? "",

      contactFactNom: f.contactFactNom ?? "",
      contactFactEmail: f.contactFactEmail ?? "",
      contactFactTelephone: f.contactFactTelephone ?? "",

      kbisUrl: f.kbisUrl ?? "",
      idCardUrl: f.idCardUrl ?? "",
      proofAddressUrl: f.proofAddressUrl ?? "",
      ribUrl: f.ribUrl ?? "",
    });
  };

  // détail
  const handleShowDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/franchises/${id}`);
      const data = await res.json();
      setSelectedFranchise(data);
    } catch (err) {
      console.error("Erreur détails franchise:", err);
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen text-red-600">
      <h1 className="text-3xl font-bold mb-6">
        {editId ? "Modifier un franchisé" : "Ajouter un franchisé"}
      </h1>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded border border-red-600"
      >
        {/* Ligne 1 */}
        <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Nom"
          value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Adresse"
          value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} required />

        {/* Ligne 2 */}
        <input className="border border-red-600 bg-black text-red-600 p-2" type="number" step="0.01" placeholder="Droit Entrée (€)"
          value={form.droitEntree} onChange={(e) => setForm({ ...form, droitEntree: e.target.value })} required />
        <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Nom du contact"
          value={form.contactNom} onChange={(e) => setForm({ ...form, contactNom: e.target.value })} required />

        {/* Ligne 3 */}
        <input className="border border-red-600 bg-black text-red-600 p-2" type="email" placeholder="Email du contact"
          value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
        <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Téléphone du contact"
          value={form.contactTelephone} onChange={(e) => setForm({ ...form, contactTelephone: e.target.value })} required />

        {/* Ligne 4 */}
        <input className="border border-red-600 bg-black text-red-600 p-2" type="date"
          value={form.dateCreation} onChange={(e) => setForm({ ...form, dateCreation: e.target.value })} required />
        <select className="border border-red-600 bg-black text-red-600 p-2" value={form.statut}
          onChange={(e) => setForm({ ...form, statut: e.target.value })}>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>

        {/* --- Nouveaux blocs --- */}
        <div className="col-span-2 border-t border-red-800 my-2"></div>

        {/* Localisation */}
        <div className="col-span-2 grid grid-cols-3 gap-4">
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Ville"
            value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Code postal"
            value={form.codePostal} onChange={(e) => setForm({ ...form, codePostal: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Pays"
            value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value })} />
        </div>

        {/* Légal & Finances */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Forme juridique (SAS, SARL...)"
            value={form.formeJuridique} onChange={(e) => setForm({ ...form, formeJuridique: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="SIRET (14 chiffres)"
            value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="TVA intracom (ex: FRxx123456789)"
            value={form.tvaIntracom} onChange={(e) => setForm({ ...form, tvaIntracom: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" type="number" step="100" placeholder="Capital social (€)"
            value={form.capitalSocial} onChange={(e) => setForm({ ...form, capitalSocial: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="IBAN"
            value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
        </div>

        {/* Contact facturation */}
        <div className="col-span-2 grid grid-cols-3 gap-4">
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Nom facturation"
            value={form.contactFactNom} onChange={(e) => setForm({ ...form, contactFactNom: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" type="email" placeholder="Email facturation"
            value={form.contactFactEmail} onChange={(e) => setForm({ ...form, contactFactEmail: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="Téléphone facturation"
            value={form.contactFactTelephone} onChange={(e) => setForm({ ...form, contactFactTelephone: e.target.value })} />
        </div>

        {/* Pièces jointes (URL placeholders pour l’instant) */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="URL KBIS (optionnel)"
            value={form.kbisUrl} onChange={(e) => setForm({ ...form, kbisUrl: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="URL pièce d'identité (optionnel)"
            value={form.idCardUrl} onChange={(e) => setForm({ ...form, idCardUrl: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="URL justificatif de domicile (optionnel)"
            value={form.proofAddressUrl} onChange={(e) => setForm({ ...form, proofAddressUrl: e.target.value })} />
          <input className="border border-red-600 bg-black text-red-600 p-2" placeholder="URL RIB (optionnel)"
            value={form.ribUrl} onChange={(e) => setForm({ ...form, ribUrl: e.target.value })} />
        </div>

        {err && <p className="col-span-2 text-red-400">{err}</p>}

        <div className="col-span-2 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm(initialFormState);
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
          <tr className="bg-gray-200 text-red-600">
            <th className="border border-red-600 px-4 py-2">Nom</th>
            <th className="border border-red-600 px-4 py-2">Contact</th>
            <th className="border border-red-600 px-4 py-2">Stats</th>
            <th className="border border-red-600 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {franchises.map((f) => (
            <tr key={f.id} className="bg-black hover:bg-gray-900">
              <td className="border border-red-600 px-4 py-2">
                <div className="font-semibold">{f.nom}</div>
                <div className="text-sm opacity-80">
                  {f.adresse ? f.adresse : ""}
                  {f.codePostal || f.ville ? (
                    <div>{[f.codePostal, f.ville].filter(Boolean).join(" ")}</div>
                  ) : null}
                  {f.formeJuridique ? <div>Statut: {f.formeJuridique}</div> : null}
                  {f.siret ? <div>SIRET: {`${String(f.siret).slice(0, 4)} **** ****`}</div> : null}
                </div>
              </td>
              <td className="border border-red-600 px-4 py-2">
                <div>{f.contactNom}</div>
                <div className="text-sm">{f.contactEmail}</div>
                <div className="text-sm">{f.contactTelephone}</div>
              </td>
              <td className="border border-red-600 px-4 py-2 text-sm">
                <div>Ventes : {f.stats?.totalVentes || 0} €</div>
                <div>Reversement : {(f.stats?.totalVentes ? f.stats.totalVentes * 0.04 : 0).toFixed(2)} €</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Stock obligatoire</span>
                    <span>{f.stats?.pourcentageObligatoire || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        (f.stats?.pourcentageObligatoire || 0) >= 80
                          ? "bg-green-500"
                          : (f.stats?.pourcentageObligatoire || 0) >= 60
                          ? "bg-orange-400"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${f.stats?.pourcentageObligatoire || 0}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="border border-red-600 px-4 py-2 flex gap-2 justify-center">
                <button onClick={() => handleEdit(f)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                  Modifier
                </button>
                <button onClick={() => handleDelete(f.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                  Supprimer
                </button>
                <button onClick={() => handleShowDetails(f.id)} className="bg-blue-500 text-white px-2 py-1 rounded">
                  Détails
                </button>
                <a href={`/api/franchises/pdf?id=${f.id}`} className="bg-green-600 text-white px-2 py-1 rounded">
                  PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rapport global */}
      <a href="/api/franchises/pdf" className="bg-purple-600 text-white px-4 py-2 rounded mt-4 inline-block">
        Rapport global
      </a>

      {/* Modal détails */}
      {selectedFranchise && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-gray-900 border border-red-600 p-6 rounded w-3/4 shadow-lg text-red-600 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Détails de {selectedFranchise.nom}</h2>

            <p><strong>Adresse :</strong> {selectedFranchise.adresse}</p>
            <p><strong>Ville :</strong> {selectedFranchise.codePostal} {selectedFranchise.ville} {selectedFranchise.pays ? `(${selectedFranchise.pays})` : ""}</p>
            <p><strong>Forme juridique :</strong> {selectedFranchise.formeJuridique || "—"}</p>
            <p><strong>SIRET :</strong> {selectedFranchise.siret || "—"}</p>
            <p><strong>TVA :</strong> {selectedFranchise.tvaIntracom || "—"}</p>
            <p><strong>Capital social :</strong> {selectedFranchise.capitalSocial ?? "—"}</p>
            <p><strong>IBAN :</strong> {selectedFranchise.iban || "—"}</p>

            <p className="mt-2">
              <strong>Contact :</strong> {selectedFranchise.contactNom} ({selectedFranchise.contactEmail}, {selectedFranchise.contactTelephone})
            </p>
            {(selectedFranchise.contactFactNom || selectedFranchise.contactFactEmail) && (
              <p><strong>Facturation :</strong> {selectedFranchise.contactFactNom || "—"} {selectedFranchise.contactFactEmail ? `(${selectedFranchise.contactFactEmail})` : ""} {selectedFranchise.contactFactTelephone ? `- ${selectedFranchise.contactFactTelephone}` : ""}</p>
            )}
            <p><strong>Statut :</strong> {selectedFranchise.statut}</p>
            <p><strong>Date création :</strong> {new Date(selectedFranchise.dateCreation).toLocaleDateString()}</p>

            {(selectedFranchise.kbisUrl || selectedFranchise.idCardUrl || selectedFranchise.proofAddressUrl || selectedFranchise.ribUrl) && (
              <>
                <hr className="my-4 border-red-600" />
                <h3 className="font-semibold text-xl mb-2">📎 Pièces jointes</h3>
                <ul className="list-disc ml-6">
                  {selectedFranchise.kbisUrl && <li>KBIS: <a className="underline" href={selectedFranchise.kbisUrl} target="_blank">ouvrir</a></li>}
                  {selectedFranchise.idCardUrl && <li>Pièce d’identité: <a className="underline" href={selectedFranchise.idCardUrl} target="_blank">ouvrir</a></li>}
                  {selectedFranchise.proofAddressUrl && <li>Justificatif de domicile: <a className="underline" href={selectedFranchise.proofAddressUrl} target="_blank">ouvrir</a></li>}
                  {selectedFranchise.ribUrl && <li>RIB: <a className="underline" href={selectedFranchise.ribUrl} target="_blank">ouvrir</a></li>}
                </ul>
              </>
            )}

            <hr className="my-4 border-red-600" />
            <h3 className="font-semibold text-xl mb-2">🚚 Camions</h3>
            {selectedFranchise.camions?.length > 0 ? (
              <ul className="list-disc ml-6">
                {selectedFranchise.camions.map((c: any) => (
                  <li key={c.id}>
                    {c.immatriculation} - {c.etat}
                    <ul className="ml-4 text-sm">
                      {c.entretiens.map((e: any) => (
                        <li key={e.id}>
                          {new Date(e.date).toLocaleDateString()} : {e.type} ({e.details || "Pas de détails"})
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : <p>Aucun camion attribué.</p>}

            <hr className="my-4 border-red-600" />
            <h3 className="font-semibold text-xl mb-2">💶 Ventes</h3>
            {selectedFranchise.ventes?.length > 0 ? (
              <ul className="list-disc ml-6">
                {selectedFranchise.ventes.map((v: any) => (
                  <li key={v.id}>{new Date(v.date).toLocaleDateString()} : {v.montant} €</li>
                ))}
              </ul>
            ) : <p>Aucune vente enregistrée.</p>}

            <hr className="my-4 border-red-600" />
            <h3 className="font-semibold text-xl mb-2">📦 Approvisionnements</h3>
            {selectedFranchise.approvisionnements?.length > 0 ? (
              <ul className="list-disc ml-6">
                {selectedFranchise.approvisionnements.map((a: any) => (
                  <li key={a.id}>
                    {new Date(a.date).toLocaleDateString()} : {a.quantite} unités depuis {a.entrepot.ville}
                    {a.obligatoire ? " (Obligatoire)" : ""}
                  </li>
                ))}
              </ul>
            ) : <p>Aucun approvisionnement enregistré.</p>}

            <button onClick={() => setSelectedFranchise(null)} className="mt-6 bg-red-600 text-white px-4 py-2 rounded">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
