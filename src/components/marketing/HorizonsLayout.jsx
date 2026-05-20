import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

export const HorizonsLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    {
      name: 'Dashboard',
      icon: '📊',
      href: '/',
      current: location.pathname === '/'
    },
    {
      name: 'Marketing',
      icon: '📢',
      children: [
        { name: 'Ofertas', href: '/marketing/offers' },
        { name: 'Nueva Oferta', href: '/marketing/offers/new' }
      ]
    },
    {
      name: 'Sales',
      icon: '💰',
      children: [
        { name: 'Ofertas', href: '/sales/offers' },
        { name: 'Bloqueos', href: '/sales/bloqueos' },
        { name: 'Confirmaciones', href: '/sales/confirmaciones' }
      ]
    },
    {
      name: 'Financiero',
      icon: '💵',
      children: [
        { name: 'Dashboard', href: '/financial/dashboard' },
        { name: 'Reportes', href: '/financial/reports' }
      ]
    },
    {
      name: 'Intelligence',
      icon: '🧠',
      children: [
        { name: 'Hotel Scores', href: '/intelligence/scores' },
        { name: 'Análisis Inversión', href: '/intelligence/investment' }
      ]
    },
    {
      name: 'Booking (Legacy)',
      icon: '🏨',
      href: '/booking',
      current: location.pathname.startsWith('/booking')
    },
    {
      name: 'Configuración',
      icon: '⚙️',
      href: '/settings',
      current: location.pathname === '/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <h1 className="text-2xl font-bold text-blue-600">
              Atlas Horizons
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Aliun Travel SRL
            </span>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              AH
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white border-r min-h-[calc(100vh-73px)] sticky top-[73px] self-start overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Sub-componente: Item de navegación
const NavItem = ({ item }) => {
  const location = useLocation();
  // Expandir automáticamente si alguna ruta hija coincide
  const hasActiveChild = item.children && item.children.some(child => location.pathname === child.href);
  const [expanded, setExpanded] = useState(hasActiveChild);

  if (item.children) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-2 rounded text-gray-700 hover:bg-gray-100 focus:outline-none"
        >
          <span className="flex items-center gap-2">
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </span>
          <span className="text-gray-400 text-xs">
            {expanded ? '▼' : '▶'}
          </span>
        </button>
        
        {expanded && (
          <div className="ml-6 space-y-1 pl-2 border-l border-gray-200">
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                className={`block px-4 py-2 rounded text-sm transition-colors ${
                  location.pathname === child.href
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
        item.current
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span>{item.icon}</span>
      <span>{item.name}</span>
    </Link>
  );
};

export default HorizonsLayout;
