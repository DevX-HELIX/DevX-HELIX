import { Outlet, Link, useLocation } from "react-router-dom"
import { Shield, LayoutDashboard, FileText, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Policies", href: "/policies", icon: Shield },
  { name: "Audit Logs", href: "/audit", icon: FileText },
  { name: "Current Run", href: "/run/latest", icon: Activity },
]

export default function DashboardLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground bg-grid-pattern relative">
      {/* Sidebar background gradient effect */}
      <div className="absolute top-0 left-0 w-64 h-full bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-black/30 backdrop-blur-3xl flex flex-col z-10">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/5 bg-gradient-to-r from-transparent to-white/[0.02]">
          <Shield className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400">
            PolicyOps
          </span>
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <ul className="flex flex-1 flex-col gap-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href)
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "group flex items-center gap-x-3 rounded-lg p-2.5 text-sm leading-6 font-medium transition-all duration-300",
                      isActive
                        ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors duration-200",
                        isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md px-8 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-zinc-400 hidden sm:block">
              {location.pathname}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              SYSTEM LIVE
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold ring-2 ring-white/10 shadow-[0_0_10px_rgba(124,58,237,0.5)] cursor-pointer hover:shadow-[0_0_20px_rgba(124,58,237,0.8)] transition-all">
              US
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 z-10 relative">
           {/* Ambient background glow for main area */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
