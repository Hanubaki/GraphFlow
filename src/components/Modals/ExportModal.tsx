import React, { useState, useEffect } from 'react';
import { GraphNode, GraphEdge } from '../../types/graph';
import {
  exportArchitectureJson,
  exportMarkdownFile,
  generateMarkdownDoc,
  generateDockerCompose,
  generateTerraform,
  exportDockerComposeFile,
  exportTerraformFile,
} from '../../utils/export';
import { sanitizeArchitectureImport } from '../../utils/securitySanitizer';
import {
  Download,
  Upload,
  FileCode,
  FileText,
  Copy,
  Check,
  X,
  Share2,
  Box,
  Cloud,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
  onImportGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  nodes,
  edges,
  onClose,
  onImportGraph,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'markdown' | 'docker' | 'terraform'>('export');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Accessibility: close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const markdownContent = generateMarkdownDoc(nodes, edges, 'Distributed System');
  const dockerComposeContent = generateDockerCompose(nodes, edges, 'graphflow');
  const terraformContent = generateTerraform(nodes, edges, 'graphflow');

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const { nodes: sanitizedNodes, edges: sanitizedEdges } = sanitizeArchitectureImport(parsed);
        if (sanitizedNodes.length > 0) {
          onImportGraph(sanitizedNodes, sanitizedEdges);
          onClose();
        } else {
          setImportError('Invalid GraphFlow architecture JSON: no valid components found.');
        }
      } catch {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-dark-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-sm font-bold text-slate-100">Export & Import Hub</h2>
              <p className="text-xs text-slate-400">Save architecture, generate specs, or import files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            aria-label="Close export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div role="tablist" aria-label="Export format selection" className="flex border-b border-slate-800 px-4 bg-dark-950/40 overflow-x-auto">
          <button
            role="tab"
            aria-selected={activeTab === 'export'}
            onClick={() => setActiveTab('export')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            File Export & Import
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'docker'}
            onClick={() => setActiveTab('docker')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'docker'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Docker Compose
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'terraform'}
            onClick={() => setActiveTab('terraform')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'terraform'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Terraform (IaC)</span>
            <span className="text-[9px] font-bold px-1.5 py-px rounded bg-slate-800 text-slate-200 border border-slate-700">
              PRO
            </span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'markdown'}
            onClick={() => setActiveTab('markdown')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'markdown'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Markdown README Spec
          </button>
        </div>

        {/* Tab Content */}
        <div role="tabpanel" aria-label={activeTab} className="p-5 overflow-y-auto flex-1">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Export JSON Card */}
                <div className="p-4 rounded-xl border border-slate-800 bg-dark-950/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs mb-1">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      JSON Architecture Schema
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Download entire system topology including nodes, pipelines, and performance configs.
                    </p>
                  </div>
                  <button
                    onClick={() => exportArchitectureJson(nodes, edges)}
                    className="w-full h-9 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON
                  </button>
                </div>

                {/* Export Markdown Card */}
                <div className="p-4 rounded-xl border border-slate-800 bg-dark-950/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs mb-1">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Markdown Architecture Doc
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Ready-to-use specification with Mermaid diagrams for your project repository.
                    </p>
                  </div>
                  <button
                    onClick={() => exportMarkdownFile(nodes, edges)}
                    className="w-full h-9 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md Spec
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-dark-950/40 text-center space-y-2 mt-4">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs font-semibold text-slate-200">Import GraphFlow JSON File</div>
                <div className="text-[11px] text-slate-500">Restore or load another architecture layout</div>
                <label className="inline-block mt-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="cursor-pointer h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center justify-center transition-colors">
                    Choose File to Load
                  </span>
                </label>
                {importError && (
                  <div className="text-xs text-rose-400 font-mono mt-2">{importError}</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Ready-to-run container network <code className="text-cyan-400 font-mono">docker-compose.yml</code>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportDockerComposeFile(nodes, edges)}
                    className="h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .yml
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(dockerComposeContent);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Compose'}
                  </button>
                </div>
              </div>

              <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed whitespace-pre select-text">
                {dockerComposeContent}
              </pre>
            </div>
          )}

          {activeTab === 'terraform' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  AWS ECS Fargate / RDS / ElastiCache IaC <code className="text-cyan-300 font-mono">main.tf</code>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportTerraformFile(nodes, edges)}
                    className="h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .tf
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(terraformContent);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Terraform'}
                  </button>
                </div>
              </div>

              <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed whitespace-pre select-text">
                {terraformContent}
              </pre>
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Embed this Markdown directly into your project's <code className="text-cyan-400 font-mono">README.md</code>
                </span>
                <button
                  onClick={handleCopyMarkdown}
                  className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed whitespace-pre select-text">
                {markdownContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
