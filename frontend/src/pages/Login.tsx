import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const roles = [
  {
    initials: 'PS',
    name: 'Priya S.',
    name2: 'Regulatory Affairs Officer',
    role: 'Regulatory Affairs',
    roleKey: 'REGULATORY_AFFAIRS',
    path: '/login/regulatory',
    avatarBg: 'bg-blue-100',
    avatarText: 'text-blue-700',
    roleBadge: 'text-blue-600',
    btnClass: 'btn btn-primary',
    btnLabel: 'Login as Priya',
    perms: [
      { ok: true,  text: 'Manages Guidelines & Rules' },
      { ok: true,  text: 'Triggers AI Pipeline' },
      { ok: false, text: 'No access to Patient PHI' },
    ],
  },
  {
    initials: 'AM',
    name: 'Arjun M.',
    name2: 'Clinical Data Manager',
    role: 'Data Manager',
    roleKey: 'DATA_MANAGER',
    path: '/login/datamanager',
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-600',
    roleBadge: 'text-amber-600',
    btnClass: 'btn bg-amber-600 text-white hover:bg-amber-700',
    btnLabel: 'Login as Arjun',
    featured: true,
    perms: [
      { ok: true,  text: 'Re-evaluates Patient Cohorts' },
      { ok: true,  text: 'CSV Reporting & Auditing' },
      { ok: false, text: 'No access to Doctor Profiles' },
    ],
  },
  {
    initials: 'DR',
    name: 'Dr. Ramesh K.',
    name2: 'Principal Investigator',
    role: 'Principal Investigator',
    roleKey: 'DOCTOR',
    path: '/login/doctor',
    avatarBg: 'bg-teal-100',
    avatarText: 'text-teal-600',
    roleBadge: 'text-teal-600',
    btnClass: 'btn btn-teal',
    btnLabel: 'Login as Dr. Ramesh',
    perms: [
      { ok: true,  text: 'Site 3 Patient Monitoring' },
      { ok: true,  text: 'PV Safety Reports & Vitals' },
      { ok: false, text: 'Scoped to Site 3 only' },
    ],
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.3 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 85, damping: 16 },
  },
};

export const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-10 px-6">

      {/* Subtle animated radial accents — barely visible on white */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.11, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-180px] left-[-180px] w-[520px] h-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.05, 0.09, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-[-150px] right-[-150px] w-[460px] h-[460px] rounded-full"
          style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }}
        />
      </div>

      {/* Logo & Header */}
      <motion.div
        className="text-center mb-10 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
      >
        <motion.img
          src="/logo.jpeg"
          alt="ReguVigil"
          className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-lg mb-4"
          style={{ boxShadow: '0 8px 32px rgba(37,99,235,0.18)' }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 130, damping: 14, delay: 0.05 }}
        />
        <motion.h1
          className="text-3xl font-bold text-slate-800 tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          ReguVigil
        </motion.h1>
        <motion.p
          className="text-slate-500 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
        >
          Regulatory Intelligence. In Real Time.
        </motion.p>
      </motion.div>

      {/* Cards */}
      <div className="w-full max-w-6xl relative z-10">
        <motion.h2
          className="text-xl font-semibold text-center mb-8 text-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
        >
          Select your role to continue
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {roles.map((r) => (
            <motion.div
              key={r.roleKey}
              variants={cardVariants}
              whileHover={{ y: -6, boxShadow: '0 24px 56px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              onClick={() => navigate(r.path)}
              className={`card bg-surface flex flex-col cursor-pointer select-none overflow-hidden
                ${r.featured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
              `}
              style={{ borderRadius: 20 }}
            >
              {/* Featured banner — inside the card at the top, not floating */}
              {r.featured && (
                <div className="bg-blue-600 text-white text-[11px] font-black text-center py-1.5 tracking-widest uppercase">
                  ★ Featured Role
                </div>
              )}

              <div className="p-8 flex flex-col flex-1">
                {/* Avatar + Name */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    whileHover={{ rotate: [-4, 4, -4, 0] }}
                    transition={{ duration: 0.4 }}
                    className={`w-16 h-16 rounded-full ${r.avatarBg} flex items-center justify-center ${r.avatarText} font-bold text-2xl flex-shrink-0`}
                  >
                    {r.initials}
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl leading-tight text-slate-800">{r.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{r.name2}</p>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${r.roleBadge}`}>
                      {r.role}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 mb-5" />

                {/* Permissions */}
                <div className="flex-1 space-y-3.5 mb-8 text-sm text-slate-600">
                  {r.perms.map((p, i) => (
                    <motion.div
                      key={i}
                      className={`flex items-center gap-2.5 font-medium ${!p.ok ? 'text-slate-400' : ''}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.06 }}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0
                        ${p.ok ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                        {p.ok ? '✓' : '✗'}
                      </span>
                      {p.text}
                    </motion.div>
                  ))}
                </div>

                {/* Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`${r.btnClass} w-full justify-center`}
                  style={{ borderRadius: 10, padding: '12px 20px' }}
                >
                  {r.btnLabel}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="mt-12 text-[11px] font-bold text-slate-400 uppercase tracking-widest relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
      >
        DEMO MODE
      </motion.div>
    </div>
  );
};
