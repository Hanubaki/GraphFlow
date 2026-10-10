import React, { useState, useCallback, useEffect } from 'react';
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
import { EmbedView } from './components/Embed/EmbedView';
import { LandingPage } from './components/Landing/LandingPage';
import { CatalogItem } from './constants/nodeCatalog';
import { GraphNode, GraphEdge } from './types/graph';
import { GeneratedArchitecture } from './services/aiGenerator';
import { SavedProject, parseShareUrl } from './services/projectStorage';
import { CloudProject } from './types/auth';
import { calculateAutoCenter } from './utils/viewportMath';
import { createNodeFromCatalog } from './utils/nodeFactory';
import { telemetry } from './utils/telemetry';

export type ActiveModal = 'templates' | 'export' | 'embed' | 'aiGen' | 'projects' | 'pricing' | 'auth' | 'analytics' | null;

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
  const [viewMode, setViewMode] = useState<'landing' | 'studio' | 'embed'>(() => {
    if (typeof window === 'undefined') return 'landing';
    if (window.location.hash.includes('#embed=')) return 'embed';
    if (window.location.hash.includes('#share=') || window.location.hash.includes('#studio')) return 'studio';
    return 'landing';
  });

  // Auto-load shared or embedded architecture from URL hash on boot
  useEffect(() => {
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
    }
  }, [setNodes, setEdges, setPan, setZoom]);

  const handleAutoCenter = useCallback((targetNodes = nodes) => {
    if (typeof window === 'undefined' || targetNodes.length === 0) return;
    const result = calculateAutoCenter(targetNodes, window.innerWidth, window.innerHeight);
    if (result) {
      setZoom(result.zoom);
      setPan(result.pan);
    }
  }, [nodes, setZoom, setPan]);

  // Auto-center on initial mount
  useEffect(() => {
    handleAutoCenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Load architecture template with success chime
  const handleSelectTemplate = useCallback((template: any) => {
    loadTemplate(template);
    soundFx.playSuccess();
    telemetry.track('Preset Loaded', { templateId: template.id, nodeCount: template.nodes.length });
  }, [loadTemplate]);

  // Import JSON graph
  const handleImportGraph = useCallback((importedNodes: GraphNode[], importedEdges: GraphEdge[]) => {
    setNodes(importedNodes);
    setEdges(importedEdges);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    soundFx.playSuccess();
    telemetry.track('Architecture Imported', { nodeCount: importedNodes.length, edgeCount: importedEdges.length });
  }, [setNodes, setEdges, setPan, setZoom]);

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
      <SimulationProvider nodes={nodes} edges={edges}>
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-dark-950 text-slate-100 select-none">
        {/* Top Navigation & Simulation Controller */}
        <TopBar
          canUndo={canUndo}
          canRedo={canRedo}
          zoom={zoom}
          onUndo={undo}
          onRedo={redo}
          onZoomIn={() => setZoom(z => Math.min(2.5, z * 1.2))}
          onZoomOut={() => setZoom(z => Math.max(0.3, z / 1.2))}
          onResetZoom={() => handleAutoCenter()}
          onOpenTemplates={() => setActiveModal('templates')}
          onOpenExport={() => setActiveModal('export')}
          onOpenEmbed={() => setActiveModal('embed')}
          onOpenAiGenerator={() => setActiveModal('aiGen')}
          onOpenProjects={() => setActiveModal('projects')}
          onOpenPricing={() => setActiveModal('pricing')}
          onOpenAnalytics={() => setActiveModal('analytics')}
          onOpenAuth={() => setActiveModal('auth')}
          onOpenHome={() => setViewMode('landing')}
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
        />
      </main>

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
      </React.Suspense>
      </div>
    </SimulationProvider>
  </MultiplayerProvider>
);
};
