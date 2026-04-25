import React, { useState } from 'react';
import { RoleSwitcher } from './RoleSwitcher';
import { apiClient } from '../api/client';

export const TopBar: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await apiClient.post('/demo/reset');
      // Strip query parameters (like ?patient=...) using History API, then force a hard reload
      window.history.replaceState(null, '', window.location.pathname);
      window.location.reload();
    } catch (e) {
      alert("Failed to reset demo: " + String(e));
      setIsResetting(false);
    }
  };

  return (
    <header className="topbar flex justify-between items-center">
      <div className="flex items-center gap-2">
        <img src="/logo.jpeg" alt="ReguVigil" className="w-8 h-8 rounded object-cover shadow-sm" />
        <span className="font-bold text-lg tracking-tight text-slate-800">ReguVigil</span>
        <Badge />
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">
            {isResetting ? 'hourglass_empty' : 'restart_alt'}
          </span>
          {isResetting ? 'RESETTING...' : 'RESET DEMO'}
        </button>
        <RoleSwitcher />
      </div>
    </header>
  );
};

const Badge = () => (
  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
    Demo
  </span>
);
