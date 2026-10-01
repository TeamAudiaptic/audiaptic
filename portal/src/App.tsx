import { useState } from 'react'
import Login from './pages/Login.tsx'
import Upload from './pages/Upload.tsx'

function App() {
  const [user, setUser] = useState<string | null>(null)

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return <Upload username={user} onLogout={() => setUser(null)} />
}

export default App
