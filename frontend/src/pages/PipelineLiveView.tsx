import React, { useState, useEffect, useRef } from 'react';
import { usePipelineRun, useTriggerPipeline, useApprovePipelineRun, useRejectPipelineRun } from '../api/queries';

const AGENT_TECHS = ['Gemini 2.5 Flash', 'JSON Diff + SQL', 'AsyncPG Batch', 'Gemini 2.5 Flash'];
const AGENT_COLORS: Record<string, { ring: string; glow: string; bg: string; text: string }> = {
  RUNNING:       { ring: '#3b82f6', glow: 'rgba(59,130,246,0.5)', bg: '#0c1a2e', text: '#93c5fd' },
  COMPLETE:      { ring: '#22c55e', glow: 'rgba(34,197,94,0.4)',  bg: '#052e16', text: '#86efac' },
  ERROR:         { ring: '#ef4444', glow: 'rgba(239,68,68,0.4)',  bg: '#1c0a0a', text: '#fca5a5' },
  PENDING_REVIEW:{ ring: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bg: '#1c1500', text: '#fcd34d' },
  IDLE:          { ring: '#334155', glow: 'transparent',           bg: '#0f172a', text: '#475569' },
};

const AgentNode = ({ agent, index }: { agent: any; index: number }) => {
  const status = ['RUNNING','COMPLETE','ERROR','PENDING_REVIEW'].includes(agent.status) ? agent.status : 'IDLE';
  const c = AGENT_COLORS[status];
  const isRunning = status === 'RUNNING';
  const isComplete = status === 'COMPLETE';
  const isError = status === 'ERROR';
  const isPendingReview = status === 'PENDING_REVIEW';

  return (
    <div className="relative flex-shrink-0" style={{ width: 220 }}>
      {/* The spinning conic-gradient border wrapper */}
      <div
        className={isRunning ? 'agent-spin-ring' : ''}
        style={{
          borderRadius: 14,
          padding: 2,
          background: isRunning ? undefined : c.ring,
          boxShadow: isRunning ? `0 0 24px 4px ${c.glow}` : isComplete ? `0 0 12px 2px ${c.glow}` : 'none',
          transition: 'box-shadow 0.5s ease',
        }}
      >
        {/* Inner card */}
        <div
          style={{ background: c.bg, borderRadius: 12, padding: '16px', position: 'relative', minHeight: 110 }}
        >
          {/* Pulsing dot indicator top-right */}
          {(isRunning || isPendingReview) && (
            <span className="absolute" style={{ top: -4, right: -4, width: 12, height: 12 }}>
              <span
                className="animate-ping absolute inline-flex rounded-full opacity-75"
                style={{ width: '100%', height: '100%', background: c.ring }}
              />
              <span
                className="relative inline-flex rounded-full"
                style={{ width: 12, height: 12, background: c.ring }}
              />
            </span>
          )}

          <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{index + 1}.</div>
          <div style={{ fontWeight: 600, color: '#f1f5f9', marginTop: 4, fontSize: 14 }}>{agent.name}</div>
          <div style={{
            fontSize: 10, color: '#93c5fd', fontFamily: 'monospace', marginTop: 6,
            background: 'rgba(30,41,59,0.6)', display: 'inline-block', padding: '2px 6px', borderRadius: 4
          }}>
            {AGENT_TECHS[index] || '—'}
          </div>

          <div style={{ marginTop: 10, fontSize: 11 }}>
            {isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.text }}>
                <span className="animate-spin" style={{
                  width: 10, height: 10, border: `1.5px solid ${c.text}`,
                  borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block'
                }} />
                Processing...
              </div>
            )}
            {isComplete && agent.duration_ms && (
              <div style={{ color: c.text, fontFamily: 'monospace' }}>✓ {(agent.duration_ms / 1000).toFixed(1)}s</div>
            )}
            {isComplete && !agent.duration_ms && (
              <div style={{ color: c.text, fontFamily: 'monospace' }}>✓ Complete</div>
            )}
            {isError && <div style={{ color: c.text }}>✗ Error</div>}
            {isPendingReview && <div style={{ color: c.text, fontFamily: 'monospace' }}>⏸ Awaiting review</div>}
            {status === 'IDLE' && <div style={{ color: c.text, fontFamily: 'monospace' }}>○ Idle</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const FlowArrow = ({ fromStatus, toStatus, pipelineRunning }: { fromStatus: string; toStatus: string; pipelineRunning: boolean }) => {
  const isHandoff = fromStatus === 'COMPLETE' && toStatus === 'RUNNING';
  const isFlowing = fromStatus === 'RUNNING';
  // Show "queued" orb during sleep gaps: source done, next idle, pipeline still alive
  const isQueued = fromStatus === 'COMPLETE' && toStatus === 'IDLE' && pipelineRunning;
  const active = isHandoff || isFlowing || isQueued;
  const color = isHandoff ? '#22c55e' : isFlowing ? '#3b82f6' : isQueued ? '#f59e0b' : '#1e293b';
  const orbGradient = isHandoff
    ? 'linear-gradient(to right, transparent, #86efac, #ffffff)'
    : isQueued
    ? 'linear-gradient(to right, transparent, #fcd34d, #ffffff)'
    : 'linear-gradient(to right, transparent, #93c5fd, #ffffff)';
  const orbShadow = isHandoff ? '0 0 10px 3px #22c55e' : isQueued ? '0 0 8px 3px #f59e0b' : '0 0 10px 3px #3b82f6';
  // Queued is slower — 1.4s; handoff/flowing is fast — 0.6s
  const orbSpeed = isQueued ? '1.4s' : '0.6s';

  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '0 8px', width: 56, flexShrink: 0 }}>
      <div style={{ flex: 1, height: 2, position: 'relative', overflow: 'hidden', background: color, borderRadius: 1, transition: 'background 0.4s ease' }}>
        {active && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 6,
              borderRadius: 3,
              background: orbGradient,
              boxShadow: orbShadow,
              animation: `travelOrb ${orbSpeed} linear infinite`,
            }}
          />
        )}
      </div>
      <span style={{
        fontSize: 18,
        marginLeft: -4,
        color: active ? color : '#334155',
        transition: 'color 0.4s ease',
        lineHeight: 1,
      }}>›</span>
    </div>
  );
};

const IDLE_AGENTS = [
  { number: 1, name: 'Regulatory Parser', status: 'IDLE' },
  { number: 2, name: 'Rule Extractor', status: 'IDLE' },
  { number: 3, name: 'Biomarker Sentinel', status: 'IDLE' },
  { number: 4, name: 'PV Reporter', status: 'IDLE' },
];

export const PipelineLiveView: React.FC = () => {
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const triggerPipeline = useTriggerPipeline();
  const approvePipeline = useApprovePipelineRun();
  const rejectPipeline = useRejectPipelineRun();

  // Poll the specific run once we have a run_id
  const { data: runData } = usePipelineRun(activeRunId || undefined);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runData?.logs]);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await triggerPipeline.mutateAsync({ file });
        if (result?.run_id) {
          setActiveRunId(result.run_id);
          showToast(`Pipeline triggered! Run ID: ${result.run_id}`, 'info');
        }
      } catch (err) {
        showToast('Upload failed. Check backend logs.', 'error');
      }
    };
    input.click();
  };

  const handleApprove = async () => {
    if (!activeRunId) return;
    try {
      await approvePipeline.mutateAsync(activeRunId);
      showToast('✓ Pipeline approved — continuing Agents 2, 3, 4...', 'success');
    } catch {
      showToast('Failed to approve pipeline.', 'error');
    }
  };

  const handleReject = async () => {
    if (!activeRunId) return;
    try {
      await rejectPipeline.mutateAsync(activeRunId);
      showToast('Pipeline rejected and cancelled.', 'info');
    } catch {
      showToast('Failed to reject pipeline.', 'error');
    }
  };

  const pipelineStatus = runData?.status || 'IDLE';
  const agents = runData?.agents?.length > 0 ? runData.agents : IDLE_AGENTS;
  const logs = runData?.logs || [];
  const isRunning = pipelineStatus === 'RUNNING';
  const isHumanReview = pipelineStatus === 'HUMAN_REVIEW';
  const isComplete = pipelineStatus === 'COMPLETE';
  const isError = pipelineStatus === 'ERROR';
  const isRejected = pipelineStatus === 'REJECTED';
  const confidenceScore = runData?.confidence_score;

  const totalMs = agents.reduce((sum: number, a: any) => sum + (a.duration_ms || 0), 0);

  return (
    <div className="p-8 max-w-[1920px] mx-auto space-y-8">
      <style>{`
        @property --spin-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotateConic {
          from { --spin-angle: 0deg; }
          to   { --spin-angle: 360deg; }
        }
        .agent-spin-ring {
          background: conic-gradient(
            from var(--spin-angle),
            #0f172a 0%,
            #0f172a 55%,
            #1d4ed8 70%,
            #3b82f6 80%,
            #22d3ee 90%,
            #0f172a 100%
          );
          animation: rotateConic 1.8s linear infinite;
          box-shadow: 0 0 28px 6px rgba(59,130,246,0.45);
        }
        @keyframes travelOrb {
          from { left: -28px; }
          to   { left: 100%; }
        }
        @keyframes slide { from { left: -20px } to { left: 100% } }
      `}</style>

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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pipeline Live View</h1>
          <p className="text-slate-500">Monitor the end-to-end multi-agent system execution.</p>
        </div>
        <button
          onClick={handleUpload}
          disabled={isRunning || triggerPipeline.isPending}
          className={`btn ${isRunning || triggerPipeline.isPending ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'btn-primary shadow-md shadow-blue-500/20'}`}
        >
          <span className="material-symbols-outlined mr-2">
            {triggerPipeline.isPending ? 'hourglass_empty' : 'upload_file'}
          </span>
          {triggerPipeline.isPending ? 'Uploading...' : 'Upload PDF & Run Pipeline'}
        </button>
      </div>

      {/* Human Review Action Bar */}
      {isHumanReview && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 flex items-center justify-between shadow-amber-200/50 shadow-lg">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-amber-500 text-3xl">gpp_maybe</span>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">⚠ Human Review Required</h3>
              <p className="text-slate-600 text-sm mt-1">
                Agent 1 confidence score: <strong className="text-amber-700">{confidenceScore ? `${(confidenceScore * 100).toFixed(0)}%` : 'Low'}</strong> — below the 70% threshold.
                Review the extracted rule and approve or reject to continue.
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              className="btn btn-primary px-6 py-2.5 disabled:opacity-60"
              onClick={handleApprove}
              disabled={approvePipeline.isPending || rejectPipeline.isPending}
            >
              {approvePipeline.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Approving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Approve & Continue
                </span>
              )}
            </button>
            <button
              className="btn bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 px-6 py-2.5 disabled:opacity-60"
              onClick={handleReject}
              disabled={approvePipeline.isPending || rejectPipeline.isPending}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">cancel</span>
                Reject
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Agent Flow Graph */}
      <div className="bg-slate-950 rounded-2xl p-8 border border-slate-800 overflow-x-auto shadow-2xl">
        <div className="flex items-center min-w-max">
          {agents.map((agent: any, idx: number) => (
            <React.Fragment key={agent.number || agent.id || idx}>
              <AgentNode agent={agent} index={idx} />
              {idx < agents.length - 1 && (
                <FlowArrow
                  fromStatus={agent.status}
                  toStatus={agents[idx + 1].status}
                  pipelineRunning={isRunning}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Status bar at bottom of graph */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-blue-400 animate-pulse' :
              isComplete ? 'bg-green-400' :
              isHumanReview ? 'bg-amber-400 animate-pulse' :
              isError ? 'bg-red-400' :
              'bg-slate-600'
            }`}></div>
            <span className="text-slate-400">{activeRunId ? `Run: ${activeRunId}` : 'No active run'}</span>
          </div>
          {confidenceScore && (
            <span className={`px-2 py-0.5 rounded ${confidenceScore >= 0.7 ? 'text-green-400 bg-green-900/30' : 'text-amber-400 bg-amber-900/30'}`}>
              Confidence: {(confidenceScore * 100).toFixed(0)}%
            </span>
          )}
          <span className="text-slate-600">{pipelineStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Terminal Log */}
        <div className="col-span-2 bg-[#0F172A] rounded-xl p-4 border border-slate-800 shadow-xl overflow-hidden h-96 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
            <h3 className="text-slate-300 font-mono text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              System Logs
              {activeRunId && <span className="text-slate-600 text-xs">— {activeRunId}</span>}
            </h3>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-1">
            {logs.length === 0 ? (
              <div className="text-slate-500">
                {activeRunId ? 'Loading logs...' : 'Waiting for pipeline trigger — upload a PDF to begin.'}
              </div>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={i} className={`${
                  log.level === 'SUCCESS' ? 'text-green-400 font-bold mt-2' :
                  log.level === 'ERROR' ? 'text-red-400' :
                  log.level === 'WARN' ? 'text-amber-300' :
                  log.message?.includes('STARTED') ? 'text-blue-400 mt-2' :
                  log.message?.includes('COMPLETE') ? 'text-green-300' :
                  'text-slate-300'
                }`}>
                  <span className="text-slate-600 mr-2">
                    [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '??:??:??'}]
                  </span>
                  {log.message}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Execution Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Execution Summary</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Status</span>
              <span className={`badge text-xs font-bold ${
                isComplete ? 'badge-primary' :
                isRunning ? 'bg-blue-100 text-blue-800 animate-pulse' :
                isHumanReview ? 'bg-amber-100 text-amber-800' :
                isError ? 'bg-red-100 text-red-800' :
                isRejected ? 'bg-slate-100 text-slate-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {pipelineStatus}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Confidence Score</span>
              <span className={`font-mono text-sm font-bold ${
                confidenceScore >= 0.7 ? 'text-green-600' : confidenceScore ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {confidenceScore ? `${(confidenceScore * 100).toFixed(0)}%` : '—'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Patients Evaluated</span>
              <span className="font-mono text-sm text-slate-800">{runData?.patients_evaluated || '—'}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Patients Flagged</span>
              <span className={`font-mono text-sm font-bold ${runData?.patients_flagged > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {runData?.patients_flagged ?? '—'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Total Time</span>
              <span className="font-mono text-sm text-slate-800">
                {totalMs > 0 ? `${(totalMs / 1000).toFixed(1)}s` : '—'}
              </span>
            </div>
          </div>

          {/* Agent Timing Breakdown */}
          {agents.some((a: any) => a.duration_ms) && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Agent Timings</p>
              <div className="space-y-2">
                {agents.map((agent: any, i: number) => agent.duration_ms ? (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-500">{i + 1}. {agent.name}</span>
                    <span className="font-mono text-slate-700">{(agent.duration_ms / 1000).toFixed(1)}s</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/dashboard/regulatory'}
                className="btn btn-ghost w-full justify-center text-primary hover:bg-blue-50 border border-blue-100"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
