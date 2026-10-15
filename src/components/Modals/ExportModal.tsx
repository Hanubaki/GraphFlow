import React, { useState, useEffect } from 'react';
import { GraphNode, GraphEdge } from '../../types/graph';
import {
  exportArchitectureJson,
  exportMarkdownFile,
  generateMarkdownDoc,
  generateDockerCompose,
  generateTerraform,
  generateKubernetesManifests,
  generateMermaidPrBundle,
  generateK6LoadTestScript,
  exportDockerComposeFile,
  exportTerraformFile,
  exportKubernetesFile,
  exportK6ScriptFile,
  exportSvgDiagram,
  exportPngDiagram,
} from '../../utils/export';
import {
  parseInfrastructureToTopology,
  SAMPLE_DOCKER_COMPOSE_IMPORT,
  SAMPLE_PACKAGE_JSON_IMPORT,
} from '../../utils/importTopology';
import { checkFeatureEntitlement } from '../../services/billing';
import { useAuth } from '../../context/AuthContext';
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
  Lock,
  Layers,
  Image as ImageIcon,
  GitBranch,
  Gauge,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
  onImportGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  onOpenPricing?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  nodes,
  edges,
  onClose,
  onImportGraph,
  onOpenPricing,
}) => {
  const { planTier, isPro } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'export' | 'mermaid' | 'k6' | 'markdown' | 'docker' | 'terraform' | 'kubernetes'
  >('export');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [iacPasteText, setIacPasteText] = useState('');
  const terraformEntitlement = checkFeatureEntitlement('terraform_export', planTier);

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
  const mermaidPrContent = generateMermaidPrBundle(nodes, edges, 'Distributed System');
  const k6ScriptContent = generateK6LoadTestScript(nodes, edges, 'graphflow');
  const dockerComposeContent = generateDockerCompose(nodes, edges, 'graphflow');
  const terraformContent = generateTerraform(nodes, edges, 'graphflow');
  const kubernetesContent = generateKubernetesManifests(nodes, edges, 'graphflow');

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
        const raw = (event.target?.result as string) || '';
        const { nodes: importedNodes, edges: importedEdges } = parseInfrastructureToTopology(raw, file.name);
        onImportGraph(importedNodes, importedEdges);
        onClose();
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse infrastructure file.');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = (rawInput = iacPasteText) => {
    setImportError(null);
    if (!rawInput.trim()) {
      setImportError('Paste a docker-compose.yml, main.tf, or GraphFlow JSON payload first.');
      return;
    }
    try {
      const { nodes: importedNodes, edges: importedEdges } = parseInfrastructureToTopology(rawInput);
      onImportGraph(importedNodes, importedEdges);
      onClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse infrastructure definition.');
    }
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
              <h2 id="export-modal-title" className="text-base font-bold text-slate-100">Export & Import Hub</h2>
              <p className="text-xs text-slate-400">Export SVG/PNG diagrams, generate IaC, or reverse-engineer Docker Compose & Terraform</p>
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
            Export & Reverse-Import
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'mermaid'}
            onClick={() => setActiveTab('mermaid')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'mermaid'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Mermaid (GitHub PR)
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'k6'}
            onClick={() => setActiveTab('k6')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'k6'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>k6 Load Test</span>
            <span className="text-[11px] font-bold px-1.5 py-px rounded bg-slate-800 text-slate-200 border border-slate-700">
              PRO
            </span>
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
            <span className="text-[11px] font-bold px-1.5 py-px rounded bg-slate-800 text-slate-200 border border-slate-700">
              PRO
            </span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'kubernetes'}
            onClick={() => setActiveTab('kubernetes')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'kubernetes'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kubernetes (K8s)</span>
            <span className="text-[11px] font-bold px-1.5 py-px rounded bg-slate-800 text-slate-200 border border-slate-700">
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
              {/* High-Res Vector SVG & Retina PNG Architecture Snapshot Card */}
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/15 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>High-Resolution Architecture Blueprint Image (SVG / 2x PNG)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                    {isPro ? 'WHITE-LABEL PRO' : 'FREE (WITH GRAPHFLOW BADGE)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Export a dark-mode CAD blueprint snapshot complete with SLA, p99 tail latency, and FinOps cloud cost HUD for GitHub PRs, Notion, and slide decks.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => exportSvgDiagram(nodes, edges, !isPro)}
                    className="h-9 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Vector .SVG
                  </button>
                  <button
                    onClick={() => exportPngDiagram(nodes, edges, !isPro)}
                    className="h-9 px-3 rounded-lg border border-cyan-500/40 bg-dark-950 hover:bg-slate-900 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Download 2x Retina .PNG
                  </button>
                </div>
              </div>

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
                    className="w-full h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
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
                    className="w-full h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md Spec
                  </button>
                </div>
              </div>

              {/* Reverse-Engineering Infrastructure Importer Section */}
              <div className="p-4 rounded-xl border border-slate-800 bg-dark-950/70 space-y-3 mt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-100">
                      Reverse-Engineer (<code className="text-cyan-300 font-mono">package.json</code>, <code className="text-cyan-300 font-mono">docker-compose.yml</code>, <code className="text-cyan-300 font-mono">main.tf</code>, <code className="text-cyan-300 font-mono">openapi.yaml</code>)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIacPasteText(SAMPLE_PACKAGE_JSON_IMPORT);
                        handlePasteImport(SAMPLE_PACKAGE_JSON_IMPORT);
                      }}
                      className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Try Sample package.json
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIacPasteText(SAMPLE_DOCKER_COMPOSE_IMPORT);
                        handlePasteImport(SAMPLE_DOCKER_COMPOSE_IMPORT);
                      }}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Try Sample docker-compose.yml
                    </button>
                  </div>
                </div>

                <textarea
                  value={iacPasteText}
                  onChange={e => setIacPasteText(e.target.value)}
                  placeholder="Paste your package.json dependencies, docker-compose.yml, Terraform main.tf, OpenAPI 3.0 YAML, or GraphFlow JSON here to auto-generate a live simulation topology..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-800 bg-dark-900 p-2.5 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".json,.yml,.yaml,.tf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="cursor-pointer h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Upload package.json / .yml / .tf
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handlePasteImport()}
                    className="h-8 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                  >
                    <Box className="w-3.5 h-3.5" />
                    Convert to Live Topology
                  </button>
                </div>

                {importError && (
                  <div className="text-xs text-rose-400 font-mono mt-1">{importError}</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mermaid' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  GitHub Pull Request & RFC native <code className="text-cyan-400 font-mono">Mermaid.js</code> bundle (Flowchart + Sequence + SLA Table)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mermaidPrContent);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied PR Bundle!' : 'Copy for GitHub PR'}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed whitespace-pre select-text">
                {mermaidPrContent}
              </pre>
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

          {(activeTab === 'terraform' || activeTab === 'kubernetes' || activeTab === 'k6') && (
            <div className="space-y-3">
              {!terraformEntitlement.allowed && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-200">
                      {activeTab === 'kubernetes'
                        ? 'Kubernetes (Deployment + Service + HPA) manifest export requires a Pro or Team plan.'
                        : activeTab === 'k6'
                          ? 'Grafana k6 automated SLA load-test script generation requires a Pro or Team plan.'
                          : terraformEntitlement.reason}
                    </span>
                  </div>
                  {onOpenPricing && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPricing();
                      }}
                      className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  {activeTab === 'kubernetes' ? (
                    <>
                      Production K8s Deployments & HPA <code className="text-cyan-300 font-mono">k8s-manifests.yaml</code>
                    </>
                  ) : activeTab === 'k6' ? (
                    <>
                      Grafana k6 Staged Stress & SLA Test <code className="text-cyan-300 font-mono">load-test.k6.js</code>
                    </>
                  ) : (
                    <>
                      AWS ECS Fargate / RDS / ElastiCache / SQS IaC <code className="text-cyan-300 font-mono">main.tf</code>
                    </>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!terraformEntitlement.allowed) {
                        onClose();
                        onOpenPricing?.();
                        return;
                      }
                      if (activeTab === 'kubernetes') {
                        exportKubernetesFile(nodes, edges);
                      } else if (activeTab === 'k6') {
                        exportK6ScriptFile(nodes, edges);
                      } else {
                        exportTerraformFile(nodes, edges);
                      }
                    }}
                    className="h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
                  >
                    {!terraformEntitlement.allowed ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    {activeTab === 'kubernetes' ? 'Download .yaml' : activeTab === 'k6' ? 'Download .k6.js' : 'Download .tf'}
                  </button>
                  <button
                    onClick={() => {
                      if (!terraformEntitlement.allowed) {
                        onClose();
                        onOpenPricing?.();
                        return;
                      }
                      const targetCode =
                        activeTab === 'kubernetes'
                          ? kubernetesContent
                          : activeTab === 'k6'
                            ? k6ScriptContent
                            : terraformContent;
                      navigator.clipboard.writeText(targetCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : activeTab === 'kubernetes' ? 'Copy K8s' : activeTab === 'k6' ? 'Copy k6 Script' : 'Copy Terraform'}
                  </button>
                </div>
              </div>

              {terraformEntitlement.allowed ? (
                <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed whitespace-pre select-text">
                  {activeTab === 'kubernetes'
                    ? kubernetesContent
                    : activeTab === 'k6'
                      ? k6ScriptContent
                      : terraformContent}
                </pre>
              ) : (
                <div className="relative rounded-xl bg-dark-950 border border-slate-800 overflow-hidden max-h-80">
                  <pre className="p-3.5 pb-1 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed whitespace-pre select-none">
                    {(activeTab === 'kubernetes'
                      ? kubernetesContent
                      : activeTab === 'k6'
                        ? k6ScriptContent
                        : terraformContent)
                      .split('\n')
                      .slice(0, 12)
                      .join('\n')}
                  </pre>
                  <pre
                    aria-hidden="true"
                    className="px-3.5 pb-3.5 font-mono text-[11px] text-slate-500 leading-relaxed whitespace-pre select-none blur-[4px] pointer-events-none"
                  >
                    {(activeTab === 'kubernetes'
                      ? kubernetesContent
                      : activeTab === 'k6'
                        ? k6ScriptContent
                        : terraformContent)
                      .split('\n')
                      .slice(12, 34)
                      .join('\n')}
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-dark-950 via-dark-950/90 to-transparent flex flex-col items-center justify-end pb-5 px-4 text-center">
                    <div className="text-xs font-semibold text-slate-100 mb-1">
                      Unlock Full{' '}
                      {activeTab === 'kubernetes'
                        ? 'Kubernetes Manifests & HPA'
                        : activeTab === 'k6'
                          ? 'Grafana k6 Load & SLA Test Script'
                          : 'AWS Terraform Infrastructure Code'}
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-md mb-3">
                      Upgrade to GraphFlow Pro to copy and download complete production IaC and load-test files tailored to your topology.
                    </p>
                    {onOpenPricing && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPricing();
                        }}
                        className="h-8 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Unlock Pro Export
                      </button>
                    )}
                  </div>
                </div>
              )}
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
