import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGraphStore } from './hooks/useGraphStore';
import { SimulationProvider } from './context/SimulationContext';
import { MultiplayerProvider } from './context/MultiplayerContext';
import { soundFx } from './utils/sound';
import { TopBar } from './components/Toolbar/TopBar';
import { NodePalette } from './components/Sidebar/NodePalette';
import { GraphCanvas } from './components/Canvas/GraphCanvas';
import { InspectorPanel } from './components/Inspector/InspectorPanel';
// Lazy-loaded on-demand modals for optimal web performance & bundle reduction
const TemplatesModal = React.lazy(() => import('./components/Modals/TemplatesModal').then(m => ({ default: m.TemplatesModal })));
const ExportModal = React.lazy(() => import('./components/Modals/ExportModal').then(m => ({ default: m.ExportModal })));
const AiGeneratorModal = React.lazy(() => import('./components/Modals/AiGeneratorModal').then(m => ({ default: m.AiGeneratorModal })));
const ProjectsModal = React.lazy(() => import('./components/Modals/ProjectsModal').then(m => ({ default: m.ProjectsModal })));
const PricingModal = React.lazy(() => import('./components/Modals/PricingModal').then(m => ({ default: m.PricingModal })));
const AuthModal = React.lazy(() => import('./components/Modals/AuthModal').then(m => ({ default: m.AuthModal })));
const EmbedModal = React.lazy(() => import('./components/Modals/EmbedModal').then(m => ({ default: m.EmbedModal })));
const AnalyticsModal = React.lazy(() => import('./components/Modals/AnalyticsModal').then(m => ({ default: m.AnalyticsModal })));
const CommandPaletteModal = React.lazy(() => import('./components/Modals/CommandPaletteModal').then(m => ({ default: m.CommandPaletteModal })));
const LiveTelemetryModal = React.lazy(() => import('./components/Modals/LiveTelemetryModal').then(m => ({ default: m.LiveTelemetryModal })));
import { EmbedView } from './components/Embed/EmbedView';
import { LandingPage } from './components/Landing/LandingPage';
import { OnboardingTour, TOUR_STORAGE_KEY } from './components/Onboarding/OnboardingTour';
import { CatalogItem } from './constants/nodeCatalog';
import { TEMPLATES } from './constants/templates';
import { GraphNode, GraphEdge } from './types/graph';
import { GeneratedArchitecture } from './services/aiGenerator';
import { SavedProject, parseShareUrl } from './services/projectStorage';
import { CloudProject } from './types/auth';
import { calculateAutoCenter } from './utils/viewportMath';
import { createNodeFromCatalog } from './utils/nodeFactory';
import { telemetry } from './utils/telemetry';
import { autoHardenTopology, autoLayoutTopology } from './utils/simulationPhysics';
import { captureFirstTouchAttribution } from './services/billing';
import {
  LiveNodeMetricUpdate,
  generateSimulatedLiveTick,
  parseLiveTelemetryPayload,
} from './services/liveTelemetry';

export type ActiveModal = 'templates' | 'export' | 'embed' | 'aiGen' | 'projects' | 'pricing' | 'auth' | 'analytics' | 'commandPalette' | 'liveTelemetry' | null;

export const App: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    selectedNode,
    selectedEdge,
    pan,
    zoom,
    setPan,
    setZoom,
    addNode,
    updateNode,
    moveNode,
    duplicateNode,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
    selectNode,
    selectEdge,
    undo,
    redo,
    canUndo,
    canRedo,
    loadTemplate,
    clearGraph,
    setNodes,
    setEdges,
  } = useGraphStore({
    onSound: (sound) => {
      if (sound === 'connect') {
        soundFx.playConnect();
      } else {
        soundFx.playClick();
      }
    },
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState<boolean>(false);

  // Real-Time Live Telemetry & ERP Digital Twin Streaming State
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [liveStreamMode, setLiveStreamMode] = useState<'demo' | 'url' | null>(null);
  const [liveEndpointUrl, setLiveEndpointUrl] = useState<string>('http://localhost:4040/metrics');
  const [livePollIntervalSec, setLivePollIntervalSec] = useState<number>(3);
  const [lastLiveTickTime, setLastLiveTickTime] = useState<string | null>(null);
  const [recentLiveUpdates, setRecentLiveUpdates] = useState<LiveNodeMetricUpdate[]>([]);
  const [liveStreamError, setLiveStreamError] = useState<string | null>(null);

  const nodesRef = useRef<GraphNode[]>(nodes);
  const liveTickCounterRef = useRef<number>(0);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const applyLiveMetricUpdates = useCallback((updates: LiveNodeMetricUpdate[]) => {
    if (!updates || updates.length === 0) return;
    const updateMap = new Map<string, LiveNodeMetricUpdate>();
    for (const u of updates) {
      updateMap.set(u.nodeId, u);
    }

    const nextNodes = nodesRef.current.map(node => {
      const u = updateMap.get(node.id);
      if (!u) return node;
      return {
        ...node,
        throughputRps: typeof u.throughputRps === 'number' ? u.throughputRps : node.throughputRps,
        latencyMs: typeof u.latencyMs === 'number' ? u.latencyMs : node.latencyMs,
        errorRate: typeof u.errorRate === 'number' ? u.errorRate : node.errorRate,
        status: u.status || node.status,
        subtitle: u.subtitle || node.subtitle,
      };
    });

    setNodes(nextNodes);
    setRecentLiveUpdates(updates);
    setLastLiveTickTime(new Date().toLocaleTimeString());
  }, [setNodes]);

  useEffect(() => {
    if (!isLiveStreaming || !liveStreamMode) return;

    let cancelled = false;

    const executeLiveTick = async () => {
      if (cancelled) return;
      const currentNodes = nodesRef.current;
      if (currentNodes.length === 0) return;

      if (liveStreamMode === 'demo') {
        liveTickCounterRef.current += 1;
        const simTick = generateSimulatedLiveTick(currentNodes, liveTickCounterRef.current);
        applyLiveMetricUpdates(simTick.parsed.updates);
        setLiveStreamError(null);
        return;
      }

      if (liveStreamMode === 'url') {
        const targetUrl = liveEndpointUrl.trim();
        if (!targetUrl) {
          setLiveStreamError('Canlı bağlantı için geçerli bir URL girin (örn. http://localhost:4040/metrics).');
          return;
        }
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(targetUrl, {
            method: 'GET',
            headers: { Accept: 'application/json, text/plain, text/csv, */*' },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          const rawText = await res.text();
          if (cancelled) return;

          const parsed = parseLiveTelemetryPayload(rawText, currentNodes);
          if (parsed.updates.length === 0) {
            setLiveStreamError(
              'Veri çekildi ancak tuvaldeki düğüm isimleriyle eşleşen departman/servis bulunamadı.'
            );
          } else {
            applyLiveMetricUpdates(parsed.updates);
            setLiveStreamError(null);
          }
        } catch (err: any) {
          if (!cancelled) {
            setLiveStreamError(
              `Bağlantı hatası (${targetUrl}): ${err?.message || 'Sunucuya ulaşılamadı. Logo ERP Bridge scriptinin çalıştığından emin olun.'}`
            );
          }
        }
      }
    };

    executeLiveTick();
    const intervalId = setInterval(executeLiveTick, Math.max(1, livePollIntervalSec) * 1000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isLiveStreaming, liveStreamMode, liveEndpointUrl, livePollIntervalSec, applyLiveMetricUpdates]);
  const [viewMode, setViewMode] = useState<'landing' | 'studio' | 'embed'>(() => {
    if (typeof window === 'undefined') return 'landing';
    if (window.location.hash.includes('#embed=')) return 'embed';
    const params = new URLSearchParams(window.location.search);
    if (
      window.location.hash.includes('#share=') ||
      window.location.hash.includes('#studio') ||
      params.has('template') ||
      params.has('blueprint') ||
      params.get('studio') === '1'
    ) {
      return 'studio';
    }
    return 'landing';
  });

  // Auto-open interactive onboarding tour on first studio entry
  useEffect(() => {
    if (viewMode !== 'studio' || typeof window === 'undefined') return;
    try {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completed) {
        const timer = setTimeout(() => setIsTourOpen(true), 120);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage errors
    }
  }, [viewMode]);

  // Capture first-touch acquisition attribution & auto-load shared architecture or URL template deep-link on boot
  useEffect(() => {
    captureFirstTouchAttribution();
    const shared = parseShareUrl();
    if (shared && shared.nodes.length > 0) {
      setNodes(shared.nodes);
      setEdges(shared.edges);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      if (shared.isEmbed) {
        setViewMode('embed');
      } else {
        setViewMode('studio');
      }
      return;
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestedTemplateId = params.get('template') || params.get('blueprint');
      if (requestedTemplateId) {
        const matchedTemplate = TEMPLATES.find(
          (t) => t.id.toLowerCase() === requestedTemplateId.toLowerCase()
        );
        if (matchedTemplate) {
          loadTemplate(matchedTemplate);
          const centered = calculateAutoCenter(matchedTemplate.nodes, window.innerWidth, window.innerHeight);
          if (centered) {
            setZoom(centered.zoom);
            setPan(centered.pan);
          }
          setViewMode('studio');
          telemetry.track('Preset Loaded', {
            templateId: matchedTemplate.id,
            nodeCount: matchedTemplate.nodes.length,
            source: 'url_deeplink',
          });
        }
      }
    }
  }, [setNodes, setEdges, setPan, setZoom, loadTemplate]);

  const handleAutoCenter = useCallback((targetNodes = nodes) => {
    if (typeof window === 'undefined' || targetNodes.length === 0) return;
    const result = calculateAutoCenter(targetNodes, window.innerWidth, window.innerHeight);
    if (result) {
      setZoom(result.zoom);
      setPan(result.pan);
    }
  }, [nodes, setZoom, setPan]);

  // Auto-center on initial mount, studio entry, and mobile screen orientation changes
  useEffect(() => {
    handleAutoCenter();
    if (typeof window === 'undefined') return;
    const handleViewportResize = () => {
      if (window.innerWidth < 768) {
        handleAutoCenter(nodesRef.current);
      }
    };
    window.addEventListener('orientationchange', handleViewportResize);
    return () => window.removeEventListener('orientationchange', handleViewportResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const handleApplyAiArchitecture = useCallback((arch: GeneratedArchitecture) => {
    setNodes(arch.nodes);
    setEdges(arch.edges);
    handleAutoCenter(arch.nodes);
  }, [setNodes, setEdges, handleAutoCenter]);

  const handleLoadSavedProject = useCallback((proj: SavedProject | CloudProject) => {
    setNodes(proj.nodes);
    setEdges(proj.edges);
    handleAutoCenter(proj.nodes);
  }, [setNodes, setEdges, handleAutoCenter]);

  // Add node from catalog to center of screen
  const handleAddNodeFromPalette = useCallback((item: CatalogItem) => {
    const centerWorldX = Math.round((-pan.x + window.innerWidth / 2) / zoom - 95);
    const centerWorldY = Math.round((-pan.y + window.innerHeight / 2) / zoom - 45);
    const newNode = createNodeFromCatalog(item, { x: centerWorldX, y: centerWorldY });
    addNode(newNode);
    soundFx.playNodeAdded();
    telemetry.track('Node Created', { type: item.type, canvasNodeCount: nodes.length + 1 });
  }, [addNode, pan, zoom, nodes.length]);

  // Add node at exact canvas coordinates (drop target)
  const handleAddNodeAt = useCallback((item: CatalogItem, x: number, y: number) => {
    const newNode = createNodeFromCatalog(item, { x, y });
    addNode(newNode);
    soundFx.playNodeAdded();
    telemetry.track('Node Created', { type: item.type, canvasNodeCount: nodes.length + 1 });
  }, [addNode, nodes.length]);

  // Delete node with audio feedback & telemetry
  const handleDeleteNode = useCallback((id: string) => {
    removeNode(id);
    soundFx.playNodeDeleted();
    telemetry.track('Node Removed', { canvasNodeCount: Math.max(0, nodes.length - 1) });
  }, [removeNode, nodes.length]);

  // Load architecture template with success chime and viewport auto-fit
  const handleSelectTemplate = useCallback((template: any) => {
    loadTemplate(template);
    handleAutoCenter(template.nodes);
    soundFx.playSuccess();
    telemetry.track('Preset Loaded', { templateId: template.id, nodeCount: template.nodes.length });
  }, [loadTemplate, handleAutoCenter]);

  // Import JSON graph
  const handleImportGraph = useCallback((importedNodes: GraphNode[], importedEdges: GraphEdge[]) => {
    setNodes(importedNodes);
    setEdges(importedEdges);
    handleAutoCenter(importedNodes);
    soundFx.playSuccess();
    telemetry.track('Architecture Imported', { nodeCount: importedNodes.length, edgeCount: importedEdges.length });
  }, [setNodes, setEdges, handleAutoCenter]);

  // Global Keyboard-First Command Palette Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    if (viewMode !== 'studio') return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveModal(prev => (prev === 'commandPalette' ? null : 'commandPalette'));
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [viewMode]);

  if (viewMode === 'embed') {
    return (
      <EmbedView
        initialNodes={nodes}
        initialEdges={edges}
      />
    );
  }

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={() => setViewMode('studio')}
          onOpenPricing={() => setActiveModal('pricing')}
          onOpenAuth={() => setActiveModal('auth')}
          onSelectBlueprint={template => {
            handleSelectTemplate(template);
            setViewMode('studio');
          }}
        />
        <PricingModal
          isOpen={activeModal === 'pricing'}
          onClose={() => setActiveModal(null)}
          onOpenAuth={() => setActiveModal('auth')}
        />
        <AuthModal
          isOpen={activeModal === 'auth'}
          onClose={() => setActiveModal(null)}
        />
      </>
    );
  }

  return (
    <MultiplayerProvider>
      <SimulationProvider nodes={nodes} edges={edges} onUpdateNode={updateNode}>
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-dark-950 text-slate-100 select-none">
        {/* Top Navigation & Simulation Controller */}
        <TopBar
          canUndo={canUndo}
          canRedo={canRedo}
          zoom={zoom}
          onUndo={undo}
          onRedo={redo}
          onZoomIn={() => setZoom(z => Math.min(2.5, z * 1.2))}
          onZoomOut={() => setZoom(z => Math.max(0.22, z / 1.2))}
          onResetZoom={() => handleAutoCenter()}
          onOpenTemplates={() => setActiveModal('templates')}
          onOpenExport={() => setActiveModal('export')}
          onOpenEmbed={() => setActiveModal('embed')}
          onOpenAiGenerator={() => setActiveModal('aiGen')}
          onOpenLiveTelemetry={() => setActiveModal('liveTelemetry')}
          isLiveStreaming={isLiveStreaming}
          onOpenProjects={() => setActiveModal('projects')}
          onOpenPricing={() => setActiveModal('pricing')}
          onOpenAnalytics={() => setActiveModal('analytics')}
          onOpenCommandPalette={() => setActiveModal('commandPalette')}
          onOpenAuth={() => setActiveModal('auth')}
          onOpenHome={() => setViewMode('landing')}
          onOpenTour={() => setIsTourOpen(true)}
          onClearGraph={clearGraph}
        />

        {/* Main Studio Workspace */}
        <main className="flex flex-1 relative overflow-hidden">
          {/* Left: Component Catalog Palette */}
          <NodePalette onAddNode={handleAddNodeFromPalette} />

          {/* Center: Interactive Graph Canvas */}
          <div className="flex-1 relative h-full">
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              pan={pan}
              zoom={zoom}
              setPan={setPan}
              setZoom={setZoom}
              onSelectNode={selectNode}
              onSelectEdge={selectEdge}
              onMoveNode={moveNode}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={removeEdge}
              onAddEdge={addEdge}
              onAddNodeAt={handleAddNodeAt}
              onUpdateNode={updateNode}
              onDuplicateNode={id => {
                duplicateNode(id);
              }}
              onResetZoom={() => handleAutoCenter()}
              isMobileInspectorOpen={isMobileInspectorOpen}
              onToggleMobileInspector={() => setIsMobileInspectorOpen(prev => !prev)}
            />
          </div>

        {/* Right: Property Inspector & Metrics */}
        <InspectorPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          edges={edges}
          onUpdateNode={updateNode}
          onUpdateEdge={updateEdge}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={removeEdge}
          isMobileOpen={isMobileInspectorOpen}
          onCloseMobile={() => setIsMobileInspectorOpen(false)}
          onAutoHarden={() => {
            const hardened = autoHardenTopology(nodes, edges);
            setNodes(hardened);
            soundFx.playSuccess();
          }}
          onAutoLayout={() => {
            const aligned = autoLayoutTopology(nodes);
            setNodes(aligned);
            handleAutoCenter(aligned);
            soundFx.playClick();
          }}
        />
      </main>

      {/* Interactive Spotlight Onboarding Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Code-split on-demand Modals with React.Suspense */}
      <React.Suspense fallback={null}>
        {activeModal === 'templates' && (
          <TemplatesModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {activeModal === 'export' && (
          <ExportModal
            isOpen={true}
            nodes={nodes}
            edges={edges}
            onClose={() => setActiveModal(null)}
            onImportGraph={handleImportGraph}
            onOpenPricing={() => setActiveModal('pricing')}
          />
        )}

        {activeModal === 'embed' && (
          <EmbedModal
            isOpen={true}
            nodes={nodes}
            edges={edges}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'aiGen' && (
          <AiGeneratorModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onApplyArchitecture={handleApplyAiArchitecture}
            onOpenPricing={() => setActiveModal('pricing')}
          />
        )}

        {activeModal === 'projects' && (
          <ProjectsModal
            isOpen={true}
            nodes={nodes}
            edges={edges}
            onClose={() => setActiveModal(null)}
            onLoadProject={handleLoadSavedProject}
            onOpenAuth={() => setActiveModal('auth')}
            onOpenPricing={() => setActiveModal('pricing')}
          />
        )}

        {activeModal === 'pricing' && (
          <PricingModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onOpenAuth={() => setActiveModal('auth')}
          />
        )}

        {activeModal === 'auth' && (
          <AuthModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'analytics' && (
          <AnalyticsModal
            isOpen={true}
            nodes={nodes}
            edges={edges}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'liveTelemetry' && (
          <LiveTelemetryModal
            isOpen={true}
            nodes={nodes}
            isStreaming={isLiveStreaming}
            streamMode={liveStreamMode}
            endpointUrl={liveEndpointUrl}
            pollIntervalSec={livePollIntervalSec}
            lastTickTime={lastLiveTickTime}
            recentUpdates={recentLiveUpdates}
            streamError={liveStreamError}
            onClose={() => setActiveModal(null)}
            onSetEndpointUrl={setLiveEndpointUrl}
            onSetPollIntervalSec={setLivePollIntervalSec}
            onStartDemoStream={() => {
              setLiveStreamError(null);
              setLiveStreamMode('demo');
              setIsLiveStreaming(true);
              soundFx.playSuccess();
              telemetry.track('Simulation Toggled', { mode: 'live_demo_stream', nodeCount: nodes.length });
            }}
            onStartUrlStream={() => {
              setLiveStreamError(null);
              setLiveStreamMode('url');
              setIsLiveStreaming(true);
              soundFx.playSuccess();
              telemetry.track('Simulation Toggled', { mode: 'live_url_stream', endpoint: liveEndpointUrl });
            }}
            onStopStream={() => {
              setIsLiveStreaming(false);
              setLiveStreamMode(null);
              soundFx.playClick();
            }}
            onApplyManualSnapshot={updates => {
              applyLiveMetricUpdates(updates);
              soundFx.playSuccess();
            }}
            onOpenPricing={() => setActiveModal('pricing')}
          />
        )}

        {activeModal === 'commandPalette' && (
          <CommandPaletteModal
            isOpen={true}
            nodes={nodes}
            onClose={() => setActiveModal(null)}
            onAddNode={handleAddNodeFromPalette}
            onSelectNode={selectNode}
            onAutoHarden={() => {
              const hardened = autoHardenTopology(nodes, edges);
              setNodes(hardened);
              soundFx.playSuccess();
            }}
            onAutoLayout={() => {
              const aligned = autoLayoutTopology(nodes);
              setNodes(aligned);
              handleAutoCenter(aligned);
              soundFx.playClick();
            }}
            onAutoCenter={() => handleAutoCenter()}
            onOpenExport={() => setActiveModal('export')}
            onOpenAiGenerator={() => setActiveModal('aiGen')}
            onOpenTemplates={() => setActiveModal('templates')}
            onOpenProjects={() => setActiveModal('projects')}
            onOpenTour={() => setIsTourOpen(true)}
            onClearGraph={clearGraph}
          />
        )}
      </React.Suspense>
      </div>
    </SimulationProvider>
  </MultiplayerProvider>
);
};
