import { useState } from 'react'

type Rule = {
  id: string
  keyword: string
  reply: string
  enabled: boolean
}

const STORAGE_KEY = 'replyflow-demo-rules'

function loadRules(): Rule[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
    )

    if (!Array.isArray(data)) return []

    return data.filter(
      (item): item is Rule =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.keyword === 'string' &&
        item.keyword.trim().length > 0 &&
        typeof item.reply === 'string' &&
        typeof item.enabled === 'boolean'
    )
  } catch {
    return []
  }
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function Automations() {
  const [rules, setRules] = useState<Rule[]>(loadRules)
  const [keyword, setKeyword] = useState('')
  const [reply, setReply] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  function saveRules(nextRules: Rule[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRules))
      setRules(nextRules)
      setResult('')
      setError('')
      return true
    } catch {
      setError("Impossible d’enregistrer dans ce navigateur.")
      return false
    }
  }

  function addRule() {
    const cleanKeyword = keyword.trim()
    const cleanReply = reply.trim()

    if (!cleanKeyword || !cleanReply) {
      setError('Renseigne le mot-clé et la réponse.')
      return
    }

    if (
      rules.some(
        (rule) => normalize(rule.keyword) === normalize(cleanKeyword)
      )
    ) {
      setError('Une règle utilise déjà ce mot-clé.')
      return
    }

    const saved = saveRules([
      ...rules,
      {
        id: crypto.randomUUID(),
        keyword: cleanKeyword,
        reply: cleanReply,
        enabled: true,
      },
    ])

    if (saved) {
      setKeyword('')
      setReply('')
    }
  }

  function toggleRule(id: string) {
    saveRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  function deleteRule(rule: Rule) {
    if (window.confirm(`Supprimer la règle « ${rule.keyword} » ?`)) {
      saveRules(rules.filter((item) => item.id !== rule.id))
    }
  }

  function simulate() {
    if (!message.trim()) {
      setResult('Saisis un message pour lancer le test.')
      return
    }

    const matchedRule = rules.find(
      (rule) =>
        rule.enabled &&
        normalize(message).includes(normalize(rule.keyword))
    )

    setResult(
      matchedRule
        ? matchedRule.reply
        : 'Aucune règle active ne correspond à ce message.'
    )
  }

  return (
    <div className="automation-layout">
      <section className="panel">
        <h2>Créer une automatisation</h2>
        <p>
          Si un message contient le mot-clé, utiliser la réponse associée.
        </p>

        <form
          className="automation-form"
          onSubmit={(event) => {
            event.preventDefault()
            addRule()
          }}
        >
          <label htmlFor="rule-keyword">Mot-clé ou expression</label>
          <input
            id="rule-keyword"
            placeholder="Ex. : prix"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            maxLength={100}
            required
          />

          <label htmlFor="rule-reply">Réponse automatique</label>
          <textarea
            id="rule-reply"
            placeholder="Bonjour ! Quel produit vous intéresse ?"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={4}
            maxLength={2000}
            required
          />

          {error && (
            <p className="form-error" role="alert">{error}</p>
          )}

          <button className="primary-button" type="submit">
            Créer la règle
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Mes règles · {rules.length}</h2>
        <p>
          La première règle active correspondante est prioritaire.
          La recherche ignore la casse et les accents.
        </p>

        {rules.length === 0 && (
          <p>Aucune règle. Crée ta première automatisation.</p>
        )}

        <div className="rule-list">
          {rules.map((rule) => (
            <article className="rule-card" key={rule.id}>
              <div className="rule-heading">
                <strong>{rule.keyword}</strong>
                <span className={rule.enabled ? 'status' : 'status draft'}>
                  {rule.enabled ? 'Active' : 'Désactivée'}
                </span>
              </div>

              <p className="rule-reply">{rule.reply}</p>

              <div className="rule-actions">
                <button
                  className="secondary-button"
                  onClick={() => toggleRule(rule.id)}
                >
                  {rule.enabled ? 'Désactiver' : 'Activer'}
                </button>

                <button
                  className="delete-button"
                  onClick={() => deleteRule(rule)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel simulator">
        <h2>Simulateur de message</h2>
        <p>Teste tes règles ici. Aucun message WhatsApp n’est envoyé.</p>

        <form
          className="automation-form"
          onSubmit={(event) => {
            event.preventDefault()
            simulate()
          }}
        >
          <label htmlFor="test-message">Message du client</label>
          <input
            id="test-message"
            placeholder="Bonjour, je voudrais connaître vos prix."
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
              setResult('')
            }}
            required
          />

          <button className="primary-button" type="submit">
            Tester la réponse
          </button>
        </form>

        {result && (
          <div className="simulation-result" role="status">
            <strong>Résultat du test</strong>
            <p>{result}</p>
          </div>
        )}
      </section>
    </div>
  )
}