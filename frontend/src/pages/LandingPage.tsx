import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: 'description',
    title: '1. Regulatory Parser',
    desc: 'Ingests 200+ page FDA/EMA guidelines via PyMuPDF and extracts biomarker threshold changes with Gemini 2.5 Flash.',
  },
  {
    icon: 'rule',
    title: '2. Rule Extractor',
    desc: 'Semantically diffs rule versions, auto-bumps version numbers, and persists rule history with full audit trails.',
  },
  {
    icon: 'monitor_heart',
    title: '3. Biomarker Sentinel',
    desc: 'Concurrently re-evaluates 500+ clinical trial patients against the new rule using async batch processing.',
  },
  {
    icon: 'summarize',
    title: '4. PV Reporter',
    desc: 'Generates an 8-section ICH E6-aligned Pharmacovigilance Safety Report and emails PIs via SendGrid.',
  },
];

const stats = [
  { value: '< 90s', label: 'End-to-end pipeline' },
  { value: '500+', label: 'Patients re-evaluated' },
  { value: '4', label: 'Autonomous AI agents' },
  { value: '3', label: 'Role-based dashboards' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: '#0B1120',
        minHeight: '100vh',
        color: '#CBD5E1',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Ambient blobs */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: '-5%', left: '-5%',
          width: '40%', height: '40%', borderRadius: '50%',
          background: 'rgba(37,99,235,0.15)', filter: 'blur(120px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', right: '-5%',
          width: '35%', height: '35%', borderRadius: '50%',
          background: 'rgba(13,148,136,0.10)', filter: 'blur(100px)',
        }} />
      </div>

      {/* Navbar */}
      <nav style={{
        position: 'relative', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 48px', maxWidth: '1280px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#2563EB', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white',
            boxShadow: '0 0 20px rgba(37,99,235,0.4)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>shield</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.5px' }}>
            ReguVigil
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#pipeline" style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            How it Works
          </a>
          <a href="#stats" style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Stats
          </a>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              color: 'white', fontWeight: 600, fontSize: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}
          >
            Access Portal →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', position: 'relative', zIndex: 10,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 99,
          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
          color: '#60A5FA', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 32,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#60A5FA',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          Powered by Gemini 2.5 Flash · LangGraph · GCP
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 72px)',
          fontWeight: 800, color: 'white',
          letterSpacing: '-1.5px', lineHeight: 1.1,
          maxWidth: 900, marginBottom: 24,
        }}>
          Regulatory Intelligence.<br />
          <span style={{
            background: 'linear-gradient(135deg, #60A5FA 0%, #2DD4BF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            In Real Time.
          </span>
        </h1>

        <p style={{
          fontSize: 18, color: '#94A3B8', maxWidth: 640,
          lineHeight: 1.7, marginBottom: 48,
        }}>
          ReguVigil autonomously parses FDA &amp; EMA guidelines, re-evaluates clinical trial
          patients, and generates ICH E6-aligned Pharmacovigilance reports — all in under 90 seconds.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '16px 36px', borderRadius: 12,
              background: '#2563EB', color: 'white',
              fontWeight: 700, fontSize: 16, border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(37,99,235,0.5)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            Start Live Demo
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
          <a
            href="#pipeline"
            style={{
              padding: '16px 36px', borderRadius: 12,
              background: 'rgba(30,41,59,0.8)', color: 'white',
              fontWeight: 600, fontSize: 16,
              border: '1px solid rgba(100,116,139,0.3)',
              cursor: 'pointer', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_circle</span>
            See How It Works
          </a>
        </div>
      </section>

      {/* Pipeline mockup */}
      <section style={{
        padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          borderRadius: 20, border: '1px solid rgba(100,116,139,0.3)',
          background: '#0F172A', overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        }}>
          {/* Window chrome */}
          <div style={{
            height: 44, background: '#020617',
            borderBottom: '1px solid rgba(100,116,139,0.2)',
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8,
          }}>
            {['#EF4444','#F59E0B','#22C55E'].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
            <span style={{
              marginLeft: 'auto', marginRight: 'auto',
              fontSize: 12, color: '#475569', fontFamily: 'monospace',
            }}>
              ReguVigil — Pipeline Live View
            </span>
          </div>
          {/* Agent nodes mock */}
          <div style={{
            padding: '48px 32px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Parser', icon: 'description', color: '#3B82F6', status: 'DONE' },
              { label: 'Extractor', icon: 'rule', color: '#8B5CF6', status: 'DONE' },
              { label: 'Sentinel', icon: 'monitor_heart', color: '#F59E0B', status: 'RUNNING' },
              { label: 'Reporter', icon: 'summarize', color: '#10B981', status: 'IDLE' },
            ].map((agent, i) => (
              <React.Fragment key={i}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 12, padding: '24px 20px', minWidth: 130,
                  borderRadius: 16, border: `1px solid ${agent.color}40`,
                  background: `${agent.color}10`,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: agent.color }}>
                    {agent.icon}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
                    Agent {i + 1}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{agent.label}</div>
                  <div style={{
                    padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                    background: agent.status === 'DONE' ? '#16A34A20' : agent.status === 'RUNNING' ? '#D9770620' : '#47556920',
                    color: agent.status === 'DONE' ? '#4ADE80' : agent.status === 'RUNNING' ? '#FCD34D' : '#64748B',
                    border: `1px solid ${agent.status === 'DONE' ? '#16A34A40' : agent.status === 'RUNNING' ? '#D9770640' : '#47556940'}`,
                  }}>
                    {agent.status}
                  </div>
                </div>
                {i < 3 && (
                  <div style={{
                    width: 40, height: 2, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                    borderRadius: 2, flexShrink: 0,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Terminal footer */}
          <div style={{
            borderTop: '1px solid rgba(100,116,139,0.2)',
            padding: '16px 24px', background: '#020617',
            fontFamily: 'monospace', fontSize: 12,
          }}>
            <span style={{ color: '#4ADE80' }}>✓</span>
            <span style={{ color: '#64748B' }}> [02:38:11]</span>
            <span style={{ color: '#94A3B8' }}> Agent 3 → Re-evaluating 500 patients against Rule v1.3 (HRV &lt; 28ms)...</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" style={{
        padding: '80px 24px',
        borderTop: '1px solid rgba(100,116,139,0.15)',
        borderBottom: '1px solid rgba(100,116,139,0.15)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 24, textAlign: 'center',
        }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{
                fontSize: 48, fontWeight: 800, color: 'white',
                background: 'linear-gradient(135deg, #60A5FA, #2DD4BF)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 14, color: '#64748B', fontWeight: 500, marginTop: 8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="pipeline" style={{
        padding: '100px 24px', position: 'relative', zIndex: 10,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800,
              color: 'white', letterSpacing: '-0.5px', marginBottom: 16,
            }}>
              Autonomous Multi-Agent Architecture
            </h2>
            <p style={{ color: '#64748B', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Four specialized AI agents, orchestrated by LangGraph, connect FDA guideline updates
              directly to patient safety alerts — automatically.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(100,116,139,0.2)',
                  borderRadius: 20, padding: 32,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(37,99,235,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#60A5FA' }}>
                    {f.icon}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 12 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles section */}
      <section style={{
        padding: '80px 24px',
        background: 'rgba(15,23,42,0.5)',
        borderTop: '1px solid rgba(100,116,139,0.15)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 16 }}>
            Three Roles. One Platform.
          </h2>
          <p style={{ color: '#64748B', marginBottom: 56 }}>
            Each persona sees a focused, role-scoped view of the trial data.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {[
              { name: 'Priya S.', role: 'Regulatory Affairs', color: '#2563EB', icon: 'policy', desc: 'Manages guidelines, triggers the AI pipeline, and approves new monitoring rules.' },
              { name: 'Arjun M.', role: 'Data Manager', color: '#D97706', icon: 'database', desc: 'Monitors re-evaluated patient cohorts, exports CSV reports, and audits data.' },
              { name: 'Dr. Ramesh K.', role: 'Principal Investigator', color: '#0D9488', icon: 'stethoscope', desc: 'Reviews flagged patients at Site 3, views 3D body scans, and downloads PV reports.' },
            ].map((r, i) => (
              <div key={i} style={{
                background: 'rgba(15,23,42,0.9)',
                border: `1px solid ${r.color}30`,
                borderRadius: 16, padding: 28, textAlign: 'left',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `${r.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: r.color }}>
                    {r.icon}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 4 }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  {r.role}
                </div>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '120px 24px', textAlign: 'center',
        position: 'relative', zIndex: 10, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%', height: 200,
          background: 'rgba(37,99,235,0.15)', filter: 'blur(80px)', borderRadius: '50%',
        }} />
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800,
          color: 'white', position: 'relative', marginBottom: 16,
        }}>
          Ready to see it in action?
        </h2>
        <p style={{ color: '#64748B', marginBottom: 48, position: 'relative' }}>
          Built for Cognizant Technoverse 2026 · Team Xypheria
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '20px 56px', borderRadius: 16,
            background: 'white', color: '#1E3A5F',
            fontWeight: 800, fontSize: 18, border: 'none',
            cursor: 'pointer', position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          Enter the Sandbox →
        </button>
      </section>

      <footer style={{
        borderTop: '1px solid rgba(100,116,139,0.15)',
        padding: '40px 24px', textAlign: 'center',
        color: '#475569', fontSize: 13, position: 'relative', zIndex: 10,
        background: '#020617',
      }}>
        <p>© 2026 Xypheria · ReguVigil · Built on Google Gemini 2.5 Flash + LangGraph</p>
      </footer>
    </div>
  );
};
