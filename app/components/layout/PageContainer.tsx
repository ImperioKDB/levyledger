interface PageContainerProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  bottomNav?: React.ReactNode
}

export function PageContainer({ children, sidebar, bottomNav }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-ink text-ledger">
      {/* Desktop Sidebar - Hidden on mobile via CSS, not conditional rendering */}
      {sidebar && <aside className="hidden xl:flex fixed inset-y-0 left-0 w-60 border-r border-rule z-30">{sidebar}</aside>}
      
      {/* Main Content Area */}
      <main className="xl:ml-60 pb-20 xl:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav - Hidden on desktop via CSS */}
      {bottomNav && <div className="fixed bottom-0 left-0 right-0 xl:hidden z-40">{bottomNav}</div>}
    </div>
  )
}
