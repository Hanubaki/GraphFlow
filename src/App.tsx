import React, { useState, useCallback, useEffect } from 'react';
import { useGraphStore } from './hooks/useGraphStore';
import { SimulationProvider } from './context/SimulationContext';
import { soundFx } from './utils/sound';
import { TopBar } from './components/Toolbar/TopBar';
import { NodePalette } from './components/Sidebar/NodePalette';
import { GraphCanvas } from './components/Canvas/GraphCanvas';
import { InspectorPanel } from './components/Inspector/InspectorPanel';
import { TemplatesModal } from './components/Modals/TemplatesModal';
import { ExportModal } from './components/Modals/ExportModal';
import { AiGeneratorModal } from './components/Modals/AiGeneratorModal';
import { ProjectsModal } from './components/Modals/ProjectsModal';
import { PricingModal } from './components/Modals/PricingModal';
import { AuthModal } from './components/Modals/AuthModal';
import { EmbedModal } from './components/Modals/EmbedModal';
import { AnalyticsModal } from './components/Modals/AnalyticsModal';
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

      {/* Architecture Presets Modal */}
      <TemplatesModal
        isOpen={activeModal === 'templates'}
        onClose={() => setActiveModal(null)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Export & Spec Generator Modal */}
      <ExportModal
        isOpen={activeModal === 'export'}
        nodes={nodes}
        edges={edges}
        onClose={() => setActiveModal(null)}
        onImportGraph={handleImportGraph}
      />

      {/* Notion & Web Iframe Embed Modal */}
      <EmbedModal
        isOpen={activeModal === 'embed'}
        nodes={nodes}
        edges={edges}
        onClose={() => setActiveModal(null)}
      />

      {/* AI Prompt-to-Architecture Modal */}
      <AiGeneratorModal
        isOpen={activeModal === 'aiGen'}
        onClose={() => setActiveModal(null)}
        onApplyArchitecture={handleApplyAiArchitecture}
      />

      {/* Cloud & Local Projects Manager */}
      <ProjectsModal
        isOpen={activeModal === 'projects'}
        nodes={nodes}
        edges={edges}
        onClose={() => setActiveModal(null)}
        onLoadProject={handleLoadSavedProject}
        onOpenAuth={() => setActiveModal('auth')}
      />

      {/* SaaS Pricing & Upgrade Modal */}
      <PricingModal
        isOpen={activeModal === 'pricing'}
        onClose={() => setActiveModal(null)}
        onOpenAuth={() => setActiveModal('auth')}
      />

      {/* User Authentication Modal */}
      <AuthModal
        isOpen={activeModal === 'auth'}
        onClose={() => setActiveModal(null)}
      />

      {/* Live Simulation & WebPerf Analytics Modal */}
      <AnalyticsModal
        isOpen={activeModal === 'analytics'}
        nodes={nodes}
        edges={edges}
        onClose={() => setActiveModal(null)}
      />
    </div>
  </SimulationProvider>
);
};
