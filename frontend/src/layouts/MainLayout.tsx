import { Outlet, NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/chat', icon: '💬', label: 'Chat' },
  { to: '/kai', icon: '🩸', label: 'Kai' },
  { to: '/lucian', icon: '🥀', label: 'Lucian' },
  { to: '/auren', icon: '🔆', label: 'Auren' },
  { to: '/xavier', icon: '💙', label: 'Xavier' },
  { to: '/creations', icon: '✨', label: 'Creations' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function MainLayout() {
  const location = useLocation();
  // Hide nav on chat thread (has an ID), show on chat list
  const hideNav = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Main content area */}
      <main className={`flex-1 overflow-auto ${hideNav ? 'pb-0' : 'pb-20'}`}>
        <Outlet />
      </main>

      {/* Bottom navigation — hidden when keyboard is open on chat page */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
            {navItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center px-1.5 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`
                }
              >
                <span className="text-lg mb-0.5">{icon}</span>
                <span className="text-[10px]">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
