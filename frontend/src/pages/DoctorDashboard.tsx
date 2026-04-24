import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { usePatients, usePatientReadings, useNotifyDoctor } from '../api/queries';
import { SITE_NAMES } from './DataManagerDashboard';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cohortRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const targetId = searchParams.get('patient');
  const urlSite = searchParams.get('site');
  
  const { data: patientsData, isLoading } = usePatients(); // Fetch all to resolve any patient
  const notifyDoctor = useNotifyDoctor();

  // Find the requested patient globally to determine their site
  const allPatients = useMemo(() => patientsData?.data || [], [patientsData]);
  const resolvedTarget = useMemo(() => {
    if (!targetId) return null;
    return allPatients.find((p: any) => p.external_id === targetId || p.id === targetId);
  }, [allPatients, targetId]);

  // Determine the active site
  const SITE_ID = urlSite || resolvedTarget?.site_id || 'site-3';
  const hospitalName = SITE_NAMES[SITE_ID] || 'Unknown Hospital';
  const siteIndex = SITE_ID.replace('site-', '');

  const patients = useMemo(() => {
    // Filter to only the active site's cohort
    const sitePatients = allPatients.filter((p: any) => p.site_id === SITE_ID);
    return sitePatients.map((p: any) => ({
      id: p.external_id || p.id,
      internalId: p.id,
      gender: p.id.includes('Female') ? 'Female' : 'Male', // Mock demographic
      age: 40 + Math.floor(Math.random() * 30), // Mock demographic
      status: p.is_flagged ? 'AT_RISK' : 'SAFE',
      hrv: p.latest_hrv != null ? Math.round(p.latest_hrv) : 35,
      spo2: 96 + Math.floor(Math.random() * 4), // Mock demographic
      hr: 65 + Math.floor(Math.random() * 20), // Mock demographic
      flaggedAgo: p.is_flagged ? 'Just now' : undefined,
      riskContext: p.is_flagged 
        ? `Breached new FDA threshold in latest pipeline run.`
        : undefined,
    }));
  }, [allPatients, SITE_ID]);

  useEffect(() => {
    if (patients.length > 0 && !selectedId) {
      const searchParams = new URLSearchParams(location.search);
      const targetId = searchParams.get('patient');
      
      if (targetId) {
        const targetPatient = patients.find(p => p.id === targetId || p.internalId === targetId);
        if (targetPatient) {
          setSelectedId(targetPatient.internalId);
          return;
        }
      }
      
      // Auto-select first at-risk or first patient if no query param or not found
      const firstRisk = patients.find(p => p.status === 'AT_RISK');
      setSelectedId(firstRisk ? firstRisk.internalId : patients[0].internalId);
    }
  }, [patients, selectedId, location.search]);

  const { data: readingsData } = usePatientReadings(selectedId || '');

  const trendData = useMemo(() => {
    if (!readingsData?.readings) return [];
    // Only take HRV_SDNN readings
    const hrvReadings = readingsData.readings.filter((r: any) => r.biomarker === 'HRV_SDNN');
    return hrvReadings.map((r: any, idx: number) => ({
      day: String(idx + 1),
      hrv: r.value
    }));
  }, [readingsData]);

  const selected = patients.find((p) => p.internalId === selectedId) || patients[0] || {} as any;
  const isRisk = selected.status === 'AT_RISK';
  
  const visiblePatients = showFlaggedOnly
    ? patients.filter((p) => p.status === 'AT_RISK')
    : patients;
    
  const flaggedCount = patients.filter(p => p.status === 'AT_RISK').length;

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleReviewAll = () => {
    setShowFlaggedOnly(true);
    const firstFlagged = patients.find((p) => p.status === 'AT_RISK');
    if (firstFlagged) setSelectedId(firstFlagged.internalId);
    cohortRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNotify = async () => {
    if (!selected.internalId) return;
    try {
      const res = await notifyDoctor.mutateAsync(selected.internalId);
      showToast(`✓ Email notification sent via SendGrid`, 'success');
    } catch {
      showToast('Failed to send notification email', 'error');
    }
  };

  const yDomain = isRisk ? [20, 40] : [28, 45];

  return (
    <div className="p-8 max-w-[1920px] mx-auto space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          {toast.message}
        </div>
      )}

      {/* Top Row */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Site Context Card */}
        <div className="lg:w-[60%] bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
              <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{hospitalName}</h2>
              <p className="text-sm text-slate-500 font-medium">Site {siteIndex} of 10 • GlucoZen Phase III Trial</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">Active Patients</p>
            <p className="text-2xl font-bold text-slate-800 tabular-nums">{patients.length}</p>
          </div>
        </div>

        {/* Alert Strip - Dynamic Notification Bell */}
        <div className={`lg:w-[40%] rounded-r-xl p-5 shadow-sm flex items-center justify-between border-l-4 ${
          flaggedCount > 0 
            ? 'bg-red-50 border-red-200 border-l-red-500' 
            : 'bg-green-50 border-green-200 border-l-green-500'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined ${flaggedCount > 0 ? 'text-red-500 animate-bounce' : 'text-green-500'}`}>
              {flaggedCount > 0 ? 'notification_important' : 'check_circle'}
            </span>
            <div>
              <h3 className={`font-bold ${flaggedCount > 0 ? 'text-red-800' : 'text-green-800'}`}>
                {flaggedCount > 0 ? 'Action Required' : 'All Clear'}
              </h3>
              <p className={`text-sm font-medium ${flaggedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {flaggedCount > 0 ? `${flaggedCount} patients newly flagged for review.` : 'No patients flagged for review at your site.'}
              </p>
            </div>
          </div>
          {flaggedCount > 0 && (
            <button
              onClick={handleReviewAll}
              className="btn bg-white text-red-700 border border-red-200 shadow-sm text-sm hover:bg-red-50 transition-colors"
            >
              {showFlaggedOnly ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFlaggedOnly(false);
                  }}
                  className="flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  Show All
                </span>
              ) : 'Review All'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left: Patient Grid */}
        <div className="lg:w-[55%] space-y-6" ref={cohortRef}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">
              Patient Cohort (Site {siteIndex})
              {showFlaggedOnly && (
                <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Flagged Only
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFlaggedOnly(false)}
                className={`badge cursor-pointer transition-colors ${!showFlaggedOnly ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All ({patients.length})
              </button>
              <button
                onClick={() => setShowFlaggedOnly(true)}
                className={`badge cursor-pointer transition-colors ${showFlaggedOnly ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                Flagged ({flaggedCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-3 py-12 flex flex-col items-center justify-center text-slate-400">
                <span className="w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full animate-spin mb-4" />
                <p>Loading your patients...</p>
              </div>
            ) : visiblePatients.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-slate-400">
                <p>No patients match the current filter.</p>
              </div>
            ) : (
              visiblePatients.map((p) => {
                const isSelected = p.internalId === selectedId;
                const pIsRisk = p.status === 'AT_RISK';
                return (
                  <div
                    key={p.internalId}
                    onClick={() => setSelectedId(p.internalId)}
                    className={`bg-white rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? 'border-2 border-primary shadow-lg shadow-blue-100'
                        : 'border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {pIsRisk && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    )}
                    <div className={`flex justify-between items-start mb-4 ${pIsRisk ? 'pl-2' : ''}`}>
                      <div>
                        <span className="font-mono text-lg font-bold text-slate-800">{p.id}</span>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                          {p.gender} • {p.age} yrs
                        </p>
                      </div>
                      <span className={`badge border text-xs ${
                        pIsRisk
                          ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                          : 'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        {pIsRisk ? 'AT RISK' : 'SAFE'}
                      </span>
                    </div>
                    <div className={`space-y-2 ${pIsRisk ? 'pl-2' : ''}`}>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 font-medium">HRV (latest)</span>
                        <span className={`text-xs font-bold ${pIsRisk ? 'text-red-600' : 'text-slate-700'}`}>
                          {p.hrv}ms
                          {pIsRisk && (
                            <span className="material-symbols-outlined text-[12px] align-middle ml-0.5">trending_down</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 font-medium">SpO2</span>
                        <span className="text-xs font-bold text-slate-700">{p.spo2}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Sticky Detail Panel */}
        <div className="lg:w-[45%]">
          {selected.internalId && (
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-mono font-bold text-slate-800">{selected.id}</h2>
                    <span className={`badge text-xs py-1 border ${
                      isRisk
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      {isRisk ? 'AT RISK' : 'SAFE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    {selected.gender} • {selected.age} yrs
                    {selected.flaggedAgo && (
                      <>
                        <span className="mx-1 text-slate-300">•</span>
                        <span className="material-symbols-outlined text-[14px]">history</span>
                        Flagged {selected.flaggedAgo}
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/dashboard/doctor/patient/${selected.internalId}/viz`)}
                  className="btn bg-slate-800 text-white hover:bg-slate-700 shadow-lg text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
                  3D Body Scan
                </button>
              </div>

              <div className="p-6 space-y-6">

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`rounded-lg p-3 text-center border ${isRisk ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <div className={`text-xs font-medium mb-1 ${isRisk ? 'text-red-800' : 'text-green-800'}`}>HRV</div>
                    <div className={`text-xl font-bold ${isRisk ? 'text-red-600' : 'text-green-600'}`}>
                      {selected.hrv}<span className={`text-xs ml-1 ${isRisk ? 'text-red-400' : 'text-green-400'}`}>ms</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-slate-500 mb-1">SpO2</div>
                    <div className="text-xl font-bold text-slate-700">{selected.spo2}<span className="text-xs text-slate-400 ml-1">%</span></div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-slate-500 mb-1">Heart Rate</div>
                    <div className="text-xl font-bold text-slate-700">{selected.hr}<span className="text-xs text-slate-400 ml-1">bpm</span></div>
                  </div>
                </div>

                {/* Chart */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">monitoring</span>
                    Real 30-Day HRV Trend
                  </h3>
                  <div
                    ref={chartContainerRef}
                    className="border border-slate-100 rounded-xl bg-slate-50 p-2 overflow-hidden"
                    style={{ height: 180 }}
                  >
                    <ResponsiveContainer width="100%" height={156}>
                      <ComposedChart
                        data={trendData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                        <YAxis domain={yDomain} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                          itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                          formatter={(v: number) => [`${Math.round(v)} ms`, 'HRV']}
                          labelFormatter={(l) => `Day ${l}`}
                        />
                        <ReferenceLine y={25} stroke="#94A3B8" strokeDasharray="4 4"
                          label={{ position: 'insideTopLeft', value: 'v1.2 (25ms)', fill: '#94A3B8', fontSize: 9 }} />
                        <ReferenceLine y={28} stroke="#EF4444"
                          label={{ position: 'insideBottomLeft', value: 'v1.3 (28ms)', fill: '#EF4444', fontSize: 9, fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="hrv" fill={isRisk ? '#fef2f2' : '#ecfdf5'} stroke="none" />
                        <Line
                          type="monotone" dataKey="hrv"
                          stroke={isRisk ? '#EF4444' : '#10B981'}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5 }}
                          isAnimationActive={true}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Rule Comparison — only shown for at-risk */}
                {isRisk && selected.riskContext && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
                      <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Regulatory Context</h4>
                        <p className="text-xs text-amber-800 leading-relaxed mb-3">{selected.riskContext}</p>
                        <div className="flex gap-4 text-xs font-medium">
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-amber-100">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-slate-600">v1.2: SAFE</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-amber-100 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-slate-800 font-bold">v1.3: AT RISK</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => navigate('/dashboard/report/1092')}
                    className="btn flex-1 justify-center py-2.5 bg-slate-800 hover:bg-slate-900 text-white shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[18px] mr-1.5">description</span>
                    View Report
                  </button>
                  <button
                    onClick={handleNotify}
                    disabled={notifyDoctor.isPending}
                    className="btn flex-1 justify-center py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px] mr-1.5">mail</span>
                    {notifyDoctor.isPending ? 'Sending...' : 'Test SendGrid Alert'}
                  </button>
                </div>
                <p className="text-center text-[11px] text-slate-400 mt-3 uppercase tracking-wider font-semibold">
                  Scoped to Site {siteIndex} Only
                </p>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
