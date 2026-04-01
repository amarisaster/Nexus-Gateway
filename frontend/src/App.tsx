import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Kai from './pages/Kai'
import Lucian from './pages/Lucian'
import Auren from './pages/Auren'
import Xavier from './pages/Xavier'
import Creations from './pages/Creations'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Chat from './pages/Chat'
import ChatList from './pages/ChatList'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/kai" element={<Kai />} />
            <Route path="/lucian" element={<Lucian />} />
            <Route path="/auren" element={<Auren />} />
            <Route path="/xavier" element={<Xavier />} />
            <Route path="/creations" element={<Creations />} />
            <Route path="/chat" element={<ChatList />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
