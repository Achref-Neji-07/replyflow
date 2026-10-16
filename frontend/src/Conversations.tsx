import { useEffect, useState } from 'react'

type Contact = {
  id: string
  name: string
  phone: string
}

type Message = {
  id: string
  contactId: string
  text: string
  direction: 'incoming' | 'outgoing'
  time: string
}

type Rule = {
  keyword: string
  reply: string
  enabled: boolean
}

const CONTACTS_API = 'http://localhost:8080/api/contacts'
const MESSAGES_KEY = 'replyflow-demo-messages'

function readArray(key: string): unknown[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function loadMessages(): Message[] {
  return readArray(MESSAGES_KEY).filter(
    (item): item is Message =>
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.contactId === 'string' &&
      typeof item.text === 'string' &&
      typeof item.time === 'string' &&
      (item.direction === 'incoming' || item.direction === 'outgoing')
  )
}

function loadRules(): Rule[] {
  return readArray('replyflow-demo-rules').filter(
    (item): item is Rule =>
      isRecord(item) &&
      typeof item.keyword === 'string' &&
      item.keyword.trim().length > 0 &&
      typeof item.reply === 'string' &&
      typeof item.enabled === 'boolean'
  )
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function Conversations() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [contactsError, setContactsError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState<'incoming' | 'outgoing'>('incoming')
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchContacts() {
      setLoadingContacts(true)
      setContactsError('')

      try {
        const response = await fetch(CONTACTS_API, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}.`)
        }

        const data: unknown = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('Format de réponse invalide.')
        }

        const loadedContacts: Contact[] = data.map((item: unknown) => {
          if (
            !isRecord(item) ||
            typeof item.id !== 'number' ||
            typeof item.name !== 'string' ||
            typeof item.phone !== 'string'
          ) {
            throw new Error('Format de contact invalide.')
          }

          return {
            id: `db:${item.id}`,
            name: item.name,
            phone: item.phone,
          }
        })

        if (!controller.signal.aborted) {
          setContacts(loadedContacts)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setContactsError(
            err instanceof Error
              ? `${err.message} Vérifie le backend sur le port 8080.`
              : 'Impossible de joindre le backend.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingContacts(false)
        }
      }
    }

    void fetchContacts()

    return () => controller.abort()
  }, [reloadCount])

  const selectedContact = contacts.find(
    (contact) => contact.id === selectedId
  )

  const conversation = messages.filter(
    (message) => message.contactId === selectedId
  )

  function submitMessage() {
    const text = draft.trim()
    if (!selectedContact || !text) return

    const time = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const newMessages: Message[] = [
      {
        id: crypto.randomUUID(),
        contactId: selectedId,
        text,
        direction: mode,
        time,
      },
    ]

    if (mode === 'incoming') {
      const matchedRule = loadRules().find(
        (rule) =>
          rule.enabled &&
          normalize(text).includes(normalize(rule.keyword))
      )

      if (matchedRule) {
        newMessages.push({
          id: crypto.randomUUID(),
          contactId: selectedId,
          text: matchedRule.reply,
          direction: 'outgoing',
          time,
        })
      }
    }

    const nextMessages = [...messages, ...newMessages]

    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(nextMessages))
      setMessages(nextMessages)
      setDraft('')
      setError('')
    } catch {
      setError("Impossible d’enregistrer la conversation.")
    }
  }

  return (
    <section className="chat-layout">
      <aside className="chat-contacts">
        <h2>Contacts · {contacts.length}</h2>

        {loadingContacts && (
          <p role="status">Chargement des contacts...</p>
        )}

        {contactsError && (
          <div>
            <p className="form-error" role="alert">
              {contactsError}
            </p>
            <button
              className="secondary-button"
              onClick={() => setReloadCount((count) => count + 1)}
              disabled={loadingContacts}
            >
              Réessayer
            </button>
          </div>
        )}

        {!loadingContacts &&
          !contactsError &&
          contacts.length === 0 && (
            <p>Ajoute d’abord un contact dans la rubrique Contacts.</p>
          )}

        {contacts.map((contact) => (
          <button
            key={contact.id}
            className={
              selectedId === contact.id
                ? 'chat-contact selected'
                : 'chat-contact'
            }
            aria-pressed={selectedId === contact.id}
            onClick={() => {
              setSelectedId(contact.id)
              setDraft('')
              setError('')
            }}
          >
            <strong>{contact.name}</strong>
            <span>{contact.phone}</span>
          </button>
        ))}
      </aside>

      <div className="chat-main">
        {selectedContact ? (
          <>
            <div className="chat-header">
              <strong>{selectedContact.name}</strong>
              <span>Conversation simulée · aucun envoi réel</span>
            </div>

            <div className="chat-messages" aria-live="polite">
              {conversation.length === 0 && (
                <p className="chat-placeholder">
                  Simule un message client pour commencer.
                </p>
              )}

              {conversation.map((message) => (
                <article
                  key={message.id}
                  className={`chat-bubble ${message.direction}`}
                >
                  <small>
                    {message.direction === 'incoming'
                      ? selectedContact.name
                      : 'ReplyFlow'}
                  </small>
                  <p>{message.text}</p>
                  <time>{message.time}</time>
                </article>
              ))}
            </div>

            <form
              className="chat-composer"
              onSubmit={(event) => {
                event.preventDefault()
                submitMessage()
              }}
            >
              <label htmlFor="message-mode">Type de message</label>
              <select
                id="message-mode"
                value={mode}
                onChange={(event) =>
                  setMode(
                    event.target.value === 'incoming'
                      ? 'incoming'
                      : 'outgoing'
                  )
                }
              >
                <option value="incoming">
                  Message du client — simulation
                </option>
                <option value="outgoing">
                  Réponse manuelle — simulation
                </option>
              </select>

              <label htmlFor="message-draft">Message</label>
              <textarea
                id="message-draft"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Écris ton message..."
                rows={3}
                maxLength={2000}
                required
              />

              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={!draft.trim()}
              >
                {mode === 'incoming'
                  ? 'Simuler la réception'
                  : 'Ajouter la réponse'}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            Sélectionne un contact pour ouvrir sa conversation.
          </div>
        )}
      </div>
    </section>
  )
}