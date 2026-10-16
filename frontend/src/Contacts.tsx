import { useEffect, useState } from 'react'
type Contact = {
  id: number
  name: string
  phone: string
}

const API_URL = 'http://localhost:8080/api/contacts'

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadContacts() {
      try {
        const response = await fetch(API_URL, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Impossible de charger les contacts.')
        }

        const data: Contact[] = await response.json()
        setContacts(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Erreur de connexion au backend.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadContacts()

    return () => controller.abort()
  }, [])

  async function addContact() {
    const cleanName = name.trim()
    const cleanPhone = phone.replace(/[\s()-]/g, '')

    if (!cleanName) {
      setError('Saisis le nom du contact.')
      return
    }

    if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
      setError('Utilise le format international : +21612345678.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
        }),
      })

      if (response.status === 409) {
        throw new Error('Ce numéro existe déjà ou les données sont incompatibles.')
      }

      if (!response.ok) {
        throw new Error(`Ajout impossible : erreur ${response.status}.`)
      }

      const created: Contact = await response.json()

      setContacts((current) => [created, ...current])
      setName('')
      setPhone('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur de connexion.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteContact(contact: Contact) {
    if (!window.confirm(`Supprimer ${contact.name} ?`)) return

    setDeletingId(contact.id)
    setError('')

    try {
      const response = await fetch(`${API_URL}/${contact.id}`, {
        method: 'DELETE',
      })

      // Si le contact a déjà été supprimé, on actualise aussi la liste.
      if (!response.ok && response.status !== 404) {
        throw new Error('Impossible de supprimer ce contact.')
      }

      setContacts((current) =>
        current.filter((item) => item.id !== contact.id)
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur de connexion.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const query = search.trim().toLowerCase()

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query)
  )

  return (
    <section className="panel">
      <h2>Mes contacts · {contacts.length}</h2>
      <p>Contacts enregistrés dans PostgreSQL via l’API Spring Boot.</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form
        className="contact-form"
        onSubmit={(event) => {
          event.preventDefault()
          void addContact()
        }}
      >
        <label>
          Nom complet
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex. : Client Demo"
            maxLength={100}
            disabled={saving}
            required
          />
        </label>

        <label>
          Téléphone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+21612345678"
            disabled={saving}
            required
          />
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={saving || loading}
        >
          {saving ? 'Enregistrement...' : 'Ajouter le contact'}
        </button>
      </form>

      <label className="search-field">
        Rechercher un contact
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nom ou numéro..."
        />
      </label>

      {loading ? (
        <p role="status">Chargement des contacts...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td>
                    <button
                      className="delete-button"
                      disabled={deletingId !== null}
                      onClick={() => void deleteContact(contact)}
                      aria-label={`Supprimer ${contact.name}`}
                    >
                      {deletingId === contact.id
                        ? 'Suppression...'
                        : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={3}>Aucun contact à afficher.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}