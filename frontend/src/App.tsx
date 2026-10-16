import { useState } from 'react'
import './App.css'
import Contacts from './Contacts'
import Automations from './Automations'
import Conversations from './Conversations'
const pages = ['Dashboard', 'Contacts', 'Conversations', 'Automatisations']

const stats = [
  { label: 'Contacts', value: '248' },
  { label: 'Messages envoyés', value: '1 420' },
  { label: 'Taux de livraison', value: '98,2 %' },
  { label: 'Règles actives', value: '6' },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">ReplyFlow<span>.</span></div>
        <p className="workspace">Espace de démonstration</p>

        <nav aria-label="Navigation principale">
          {pages.map((page) => (
            <button
              key={page}
              className={activePage === page ? 'nav-item active' : 'nav-item'}
              onClick={() => setActivePage(page)}
              aria-current={activePage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </nav>

        <div className="profile">AN · Achref Neji</div>
      </aside>

      <main className="content">
        <header className="header">
          <div>
            <p className="eyebrow">WORKSPACE / {activePage.toUpperCase()}</p>
            <h1>{activePage}</h1>
          </div>
          <span className="badge">Mode démo</span>
        </header>

        {activePage === 'Dashboard' ? (
          <>
            <section className="welcome">
              <h2>Bienvenue, Achref 👋</h2>
              <p>Retrouve l’activité de ta messagerie en un coup d’œil.</p>
            </section>

            <section className="stats" aria-label="Statistiques de démonstration">
              {stats.map((stat) => (
                <article className="stat-card" key={stat.label}>
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                  <span>Données simulées</span>
                </article>
              ))}
            </section>

            <section className="panel">
              <h2>Dernières campagnes</h2>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Campagne</th>
                      <th>Audience</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Bienvenue aux nouveaux clients</td>
                      <td>120 contacts</td>
                      <td><span className="status">Terminée</span></td>
                    </tr>
                    <tr>
                      <td>Offre du week-end</td>
                      <td>85 contacts</td>
                      <td><span className="status draft">Brouillon</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
                        ) : activePage === 'Contacts' ? (
          <Contacts />
        ) : activePage === 'Automatisations' ? (
          <Automations />
        ) : activePage === 'Conversations' ? (
          <Conversations />
        ) : (
          <section className="panel empty-state">
            <h2>{activePage}</h2>
            <p>Ce module sera développé à la prochaine étape.</p>
            <button
              className="primary-button"
              onClick={() => setActivePage('Dashboard')}
            >
              Revenir au dashboard
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App