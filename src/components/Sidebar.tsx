import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BedDouble, 
  IndianRupee, 
  Receipt, 
  LineChart,
  Building,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: BedDouble, label: 'Rooms', path: '/rooms' },
  { icon: Users, label: 'Tenants', path: '/tenants' },
  { icon: IndianRupee, label: 'Rent', path: '/rent' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Wallet, label: 'Advance', path: '/advance' },
  { icon: LineChart, label: 'Reports', path: '/reports' },
];

export function Sidebar({ className, onClose }: { className?: string, onClose?: () => void }) {
  // To use a custom logo, replace this URL with your logo image URL (e.g., '/logo.png')
  const logoUrl = "/logo.png"; 

  return (
    <aside className={cn("flex flex-col w-64 bg-slate-900 text-slate-300 h-full border-r border-slate-800", className)}>
      <div className="p-6 flex items-center gap-3 text-white">
        {logoUrl ? (
          <img src={logoUrl} alt="PG Manager Logo" className="w-8 h-8 object-contain rounded" />
        ) : (
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Building className="w-6 h-6 text-white" />
          </div>
        )}
        <span className="text-xl font-bold tracking-tight">PG Manager</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
