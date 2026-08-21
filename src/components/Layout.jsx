import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Calculator, Cpu, LogOut, User as UserIcon, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/simulator', label: 'Simulator', icon: Calculator },
    { to: '/devices', label: 'Device Management', icon: Cpu }
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-60 flex-shrink-0 bg-slate-900 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="text-white font-bold text-sm tracking-tight">APP MODEL</div>
              <div className="text-slate-500 text-[11px] font-medium">Device Simulator</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User panel */}
        <div className="px-3 py-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-200 text-sm font-medium truncate">{user?.username}</div>
              <div className="text-slate-500 text-[11px] capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-all duration-150"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-slate-900 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-white font-bold text-sm">APP MODEL</span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
