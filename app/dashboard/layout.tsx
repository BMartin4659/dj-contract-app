'use client';

import Header from "@/components/Header";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, CalendarIcon, BookOpenIcon, UserGroupIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
  { name: 'Bookings', href: '/dashboard/bookings', icon: BookOpenIcon },
  { name: 'Client Portal', href: '/client-portal', icon: UserGroupIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog8ToothIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 mb-8">
            <span className="text-2xl">🎧</span>
            <h1 className="text-xl font-bold text-white">DJ Dashboard</h1>
          </Link>
          
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
} 