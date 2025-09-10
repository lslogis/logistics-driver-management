// FIX: Implemented the Sidebar component for navigation.
import React from 'react';
import { ChartBarIcon, UsersIcon, TruckIcon, MapIcon, CurrencyDollarIcon, LocationMarkerIcon, TableCellsIcon, ClipboardDocumentCheckIcon } from './icons';

type Page = 'dashboard' | 'drivers' | 'trips' | 'fixedRoutes' | 'settlement' | 'loadingPointSettlement' | 'charterCosts' | 'charterDispatch';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: ChartBarIcon },
    { id: 'drivers', label: '기사 관리', icon: UsersIcon },
    { id: 'trips', label: '운행 내역', icon: TruckIcon },
    { id: 'fixedRoutes', label: '고정 코스 관리', icon: MapIcon },
    { id: 'charterDispatch', label: '용차배차 관리', icon: ClipboardDocumentCheckIcon },
    { id: 'charterCosts', label: '운임표 관리', icon: TableCellsIcon },
    { id: 'settlement', label: '기사별 정산', icon: CurrencyDollarIcon },
    { id: 'loadingPointSettlement', label: '상차지별 정산', icon: LocationMarkerIcon },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col min-h-screen">
      <div className="p-5 text-2xl font-bold border-b border-gray-700">
        운송 관리
      </div>
      <nav className="flex-1 p-2">
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id as Page)}
                className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="w-6 h-6 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;