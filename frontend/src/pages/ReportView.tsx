import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';

export const ReportView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendToSponsor = async () => {
    setIsSending(true);
    // Simulate sending email to sponsor
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      alert('Report securely emailed to Sponsor');
      setTimeout(() => setIsSent(false), 3000);
    }, 1500);
  };

  const handleDownloadPDF = async () => {
    try {
      const reportId = id || '1092';
      const response = await apiClient.get(`/reports/${reportId}/pdf`, { responseType: 'blob' });
      
      // Fix: enforce blob type and use link.download property directly
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PV_Report_${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("PDF download failed", error);
      alert('Failed to download PDF');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-slate-100 py-12 px-4 flex justify-center">
      
      {/* Report Card */}
      <div className="w-full max-w-[860px] bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Top Header / Actions (Not printed in PDF ideally) */}
        <div className="bg-slate-50 border-b border-slate-200 px-10 py-4 flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleSendToSponsor}
              disabled={isSending}
              className="btn bg-white border border-slate-300 text-slate-700 shadow-sm text-sm py-1.5 disabled:opacity-50"
            >
              {isSending ? (
                <span className="material-symbols-outlined text-[16px] mr-1.5 animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-[16px] mr-1.5">mail</span>
              )}
              {isSending ? 'Sending...' : 'Send to Sponsor'}
            </button>
            <button onClick={handleDownloadPDF} className="btn btn-primary text-sm py-1.5 shadow-md shadow-blue-500/20">
              <span className="material-symbols-outlined text-[16px] mr-1.5">download</span>
              Download PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="px-10 py-12 space-y-10">
          
          {/* Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-slate-800 text-white rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">shield</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pharmacovigilance Safety Report</h1>
                <p className="text-slate-500 font-medium tracking-wide mt-1">Automated Regulatory Pipeline</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-100 text-slate-600 font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded mb-2 inline-block">
                Strictly Confidential
              </div>
              <p className="font-mono text-sm font-bold text-slate-800">CASE: PV-{id || '1092'}</p>
            </div>
          </div>

          {/* Info Bar */}
          <div className="grid grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trial</div>
              <div className="font-bold text-slate-800 text-sm">GlucoZen Phase III</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</div>
              <div className="font-bold text-slate-800 text-sm">Oct 24, 2026</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trigger</div>
              <div className="font-bold text-primary text-sm">Rule v1.3 Update</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
              <div className="badge bg-amber-100 text-amber-800 border border-amber-200 inline-flex">PENDING SPONSOR REVIEW</div>
            </div>
          </div>

          {/* Section 2: Executive Summary */}
          <section>
            <div className="bg-slate-50 py-1.5 px-3 border-l-2 border-primary mb-4">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">2. Executive Summary</h2>
            </div>
            <div className="px-3 text-slate-700 text-sm leading-relaxed space-y-3">
              <p>
                Following the automated parsing of the latest FDA clinical guidance update, a new monitoring rule (v1.3) was instantiated. 
                This rule adjusted the Heart Rate Variability (HRV SDNN) critical threshold from <b>25ms to 28ms</b>.
              </p>
              <p>
                A retrospective cohort re-evaluation of 500 active patients across 10 trial sites identified <b>3 patients</b> who are now classified as <span className="text-red-600 font-bold">AT RISK</span>. 
                Immediate clinical review by the respective Principal Investigators is required.
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 4: Rule Change Diff */}
          <section>
            <div className="bg-slate-50 py-1.5 px-3 border-l-2 border-primary mb-4">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">4. Rule Change Specification</h2>
            </div>
            <div className="px-3 flex gap-4">
              <div className="flex-1 bg-white border border-slate-200 rounded p-4 opacity-75">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Superseded (v1.2)</div>
                <div className="font-mono text-sm text-slate-500 line-through">IF HRV &lt; 25ms THEN FLAG</div>
              </div>
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded p-4">
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex justify-between">
                  Active (v1.3)
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                </div>
                <div className="font-mono text-sm text-slate-800 font-bold">IF HRV &lt; 28ms THEN FLAG</div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 5: Affected Patient Table */}
          <section>
            <div className="bg-slate-50 py-1.5 px-3 border-l-2 border-primary mb-4">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">5. Affected Patient Roster</h2>
            </div>
            <div className="px-3">
              <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-medium">
                    <th className="px-4 py-2 border-b border-slate-200">Patient ID</th>
                    <th className="px-4 py-2 border-b border-slate-200">Site</th>
                    <th className="px-4 py-2 border-b border-slate-200">Value</th>
                    <th className="px-4 py-2 border-b border-slate-200">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono font-bold text-slate-800">PT-8091</td>
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-600">Site 3</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono text-red-600">24ms</td>
                    <td className="px-4 py-3 border-b border-slate-100"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">HIGH</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono font-bold text-slate-800">PT-1102</td>
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-600">Site 3</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono text-red-600">26ms</td>
                    <td className="px-4 py-3 border-b border-slate-100"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">HIGH</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono font-bold text-slate-800">PT-4399</td>
                    <td className="px-4 py-3 border-b border-slate-100 text-slate-600">Site 8</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono text-amber-600">27.5ms</td>
                    <td className="px-4 py-3 border-b border-slate-100"><span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">MODERATE</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 7: Recommended Actions */}
          <section>
            <div className="bg-slate-50 py-1.5 px-3 border-l-2 border-primary mb-4">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">7. Recommended Actions (AI Generated)</h2>
            </div>
            <div className="px-3">
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-2 leading-relaxed">
                <li>Notify Principal Investigators at Site 3 and Site 8 to conduct immediate cardiac reviews.</li>
                <li>Temporarily suspend dosing for PT-8091 until secondary diagnostics confirm cardiac safety.</li>
                <li>Submit expedited protocol deviation notice to IRB regarding the revised parameter monitoring.</li>
              </ul>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-slate-800 text-slate-400 py-6 px-10 text-xs flex justify-between items-center">
          <div>Generated by <b>ReguVigil</b> Multi-Agent Pipeline</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">memory</span>
              Gemini 2.5 Flash
            </span>
            <span>ICH E6 (R2) Aligned</span>
          </div>
        </div>

      </div>
    </div>
  );
};
