import React, { useRef, useEffect, useState } from 'react';

// 10 Indian hospital sites with GPS coords and site IDs matching the seed data
const SITES = [
  { id: 'site-1',  name: 'AIIMS Delhi',           lat: 28.5672,  lng: 77.2100,  city: 'Delhi' },
  { id: 'site-2',  name: 'Fortis Mumbai',          lat: 19.1750,  lng: 72.8482,  city: 'Mumbai' },
  { id: 'site-3',  name: 'Apollo Chennai',         lat: 13.0067,  lng: 80.2206,  city: 'Chennai' },
  { id: 'site-4',  name: 'Manipal Bangalore',      lat: 12.9250,  lng: 77.6010,  city: 'Bangalore' },
  { id: 'site-5',  name: 'PGIMER Chandigarh',      lat: 30.7652,  lng: 76.7846,  city: 'Chandigarh' },
  { id: 'site-6',  name: 'KGMU Lucknow',           lat: 26.8500,  lng: 80.9462,  city: 'Lucknow' },
  { id: 'site-7',  name: 'NIMHANS Bangalore',      lat: 12.9350,  lng: 77.5960,  city: 'Bangalore' },
  { id: 'site-8',  name: 'AIIMS Bhubaneswar',      lat: 20.2961,  lng: 85.8245,  city: 'Bhubaneswar' },
  { id: 'site-9',  name: 'Tata Medical Kolkata',   lat: 22.5726,  lng: 88.3639,  city: 'Kolkata' },
  { id: 'site-10', name: 'Amrita Kochi',           lat: 10.0261,  lng: 76.3125,  city: 'Kochi' },
];

interface SiteData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  flagged: number;
  total: number;
}

interface GlobeVisualizationProps {
  siteFlags: Record<string, number>;
  siteTotals: Record<string, number>;
  activeSiteId: string | null;
  onSiteClick: (siteId: string) => void;
}

const GlobeVisualization: React.FC<GlobeVisualizationProps> = ({ siteFlags, siteTotals, activeSiteId, onSiteClick }) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [GlobeGL, setGlobeGL] = useState<any>(null);
  const [hovered, setHovered] = useState<SiteData | null>(null);

  // Dynamically import to avoid SSR issues
  useEffect(() => {
    import('react-globe.gl').then(mod => {
      setGlobeGL(() => mod.default);
    });
  }, []);

  const siteData: SiteData[] = SITES.map(s => ({
    ...s,
    flagged: siteFlags[s.id] || 0,
    total: siteTotals[s.id] || 50,
  }));

  const getColor = (site: SiteData) => {
    if (activeSiteId === site.id) return '#6366f1'; // indigo when selected
    if (site.flagged > 0) return '#ef4444'; // red if any flagged
    return '#22c55e'; // green if all safe
  };

  const getAltitude = (site: SiteData) => {
    if (site.flagged > 3) return 0.08;
    if (site.flagged > 0) return 0.05;
    return 0.02;
  };

  if (!GlobeGL) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
          <span className="text-sm font-mono">Loading Globe...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      <GlobeGL
        ref={globeRef}
        width={containerRef.current?.offsetWidth || 600}
        height={containerRef.current?.offsetHeight || 500}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        pointsData={siteData}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: any) => getColor(d)}
        pointAltitude={(d: any) => getAltitude(d)}
        pointRadius={0.6}
        pointLabel={(d: any) => `
          <div style="background:#1e293b;padding:8px 12px;border-radius:8px;border:1px solid #334155;font-family:monospace;font-size:12px;color:white;min-width:150px">
            <div style="font-weight:bold;color:${d.flagged > 0 ? '#f87171' : '#4ade80'};margin-bottom:4px">${d.name}</div>
            <div style="color:#94a3b8">${d.city}</div>
            <div style="margin-top:6px;color:${d.flagged > 0 ? '#fca5a5' : '#86efac'}">
              ${d.flagged > 0 ? `⚠ ${d.flagged} AT RISK` : '✓ All Safe'}
            </div>
            <div style="color:#64748b;font-size:11px">${d.total} patients</div>
          </div>
        `}
        onPointClick={(d: any) => onSiteClick(d.id)}
        onPointHover={(d: any) => setHovered(d)}
        pointsMerge={false}
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.12}
        enablePointerInteraction={true}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 rounded-xl px-4 py-3 text-xs font-mono space-y-2 border border-slate-700">
        <div className="text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-slate-300">Site Safe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-300">Site has AT RISK patients</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-slate-300">Selected Site</span>
        </div>
      </div>

      {/* Site count badge */}
      <div className="absolute top-4 right-4 bg-slate-900/90 rounded-xl px-4 py-2 text-xs font-mono border border-slate-700">
        <span className="text-slate-400">Sites: </span>
        <span className="text-white font-bold">{SITES.length}</span>
        <span className="text-slate-600"> · </span>
        <span className="text-red-400">{Object.values(siteFlags).filter(v => v > 0).length} flagged</span>
      </div>
    </div>
  );
};

export default GlobeVisualization;
export { SITES };
