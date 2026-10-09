import React, { useState, useCallback, useEffect } from 'react';
import { useGraphStore } from './hooks/useGraphStore';
import { useSimulation } from './hooks/useSimulation';
import { TopBar } from './components/Toolbar/TopBar';
import { NodePalette } from './components/Sidebar/NodePalette';
import { GraphCanvas } from './components/Canvas/GraphCanvas';
import { InspectorPanel } from './components/Inspector/InspectorPanel';
import { TemplatesModal } from './components/Modals/TemplatesModal';
import { ExportModal } from './components/Modals/ExportModal';
import { AiGeneratorModal } from './components/Modals/AiGeneratorModal';
import { ProjectsModal } from './components/Modals/ProjectsModal';
import { PricingModal } from './components/Modals/PricingModal';
import { EmbedModal } from './components/Modals/EmbedModal';
import { EmbedView } from './components/Embed/EmbedView';
import { LandingPage } from './components/Landing/LandingPage';
import { CatalogItem } from './constants/nodeCatalog';
import { GraphNode, GraphEdge } from './types/graph';
import { GeneratedArchitecture } from './services/aiGenerator';
import { SavedProject, parseShareUrl } from './services/projectStorage';

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
  } = useGraphStore();

  const {
    isRunning,
    speedMultiplier,
    isSpikeMode,
    soundEnabled,
    packets,
    metrics,
    togglePlay,
    setSpeedMultiplier,
    triggerSpike,
    toggleSound,
  } = useSimulation(nodes, edges);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [isAiGenOpen, setIsAiGenOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
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

  const handleApplyAiArchitecture = useCallback((arch: GeneratedArchitecture) => {
    setNodes(arch.nodes);
    setEdges(arch.edges);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [setNodes, setEdges, setPan, setZoom]);

  const handleLoadSavedProject = useCallback((proj: SavedProject) => {
    setNodes(proj.nodes);
    setEdges(proj.edges);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [setNodes, setEdges, setPan, setZoom]);

  // Add node from catalog to center of screen
  const handleAddNodeFromPalette = useCallback((item: CatalogItem) => {
    const centerWorldX = Math.round((-pan.x + window.innerWidth / 2) / zoom - 95);
    const centerWorldY = Math.round((-pan.y + window.innerHeight / 2) / zoom - 45);

    const newNode: GraphNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      x: centerWorldX,
      y: centerWorldY,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: item.defaultLatencyMs,
      errorRate: item.defaultErrorRate,
      throughputRps: item.defaultThroughput,
      color: item.color,
      iconName: item.iconName,
    };

    addNode(newNode);
  }, [addNode, pan, zoom]);

  // Add node at exact canvas coordinates (drop target)
  const handleAddNodeAt = useCallback((item: CatalogItem, x: number, y: number) => {
    const newNode: GraphNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      x,
      y,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: item.defaultLatencyMs,
      errorRate: item.defaultErrorRate,
      throughputRps: item.defaultThroughput,
      color: item.color,
      iconName: item.iconName,
    };

    addNode(newNode);
  }, [addNode]);

  // Import JSON graph
  const handleImportGraph = useCallback((importedNodes: GraphNode[], importedEdges: GraphEdge[]) => {
    setNodes(importedNodes);
    setEdges(importedEdges);
    setPan({ x: 0, y: 0 });
    setZoom(1);
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
          onOpenPricing={() => setIsPricingOpen(true)}
        />
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-dark-950 text-slate-100 select-none">
      {/* Top Navigation & Simulation Controller */}
      <TopBar
        isRunning={isRunning}
        speedMultiplier={speedMultiplier}
        isSpikeMode={isSpikeMode}
        soundEnabled={soundEnabled}
        metrics={metrics}
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
        onTogglePlay={togglePlay}
        onSetSpeed={setSpeedMultiplier}
        onTriggerSpike={triggerSpike}
        onToggleSound={toggleSound}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={() => setZoom(z => Math.min(2.5, z * 1.2))}
        onZoomOut={() => setZoom(z => Math.max(0.3, z / 1.2))}
        onResetZoom={() => {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenEmbed={() => setIsEmbedOpen(true)}
        onOpenAiGenerator={() => setIsAiGenOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
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
            packets={packets}
            pan={pan}
            zoom={zoom}
            setPan={setPan}
            setZoom={setZoom}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onMoveNode={moveNode}
            onDeleteNode={removeNode}
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
          onDeleteNode={removeNode}
          onDeleteEdge={removeEdge}
        />
      </main>

      {/* Architecture Presets Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={loadTemplate}
      />

      {/* Export & Spec Generator Modal */}
      <ExportModal
        isOpen={isExportOpen}
        nodes={nodes}
        edges={edges}
        onClose={() => setIsExportOpen(false)}
        onImportGraph={handleImportGraph}
      />

      {/* Notion & Web Iframe Embed Modal */}
      <EmbedModal
        isOpen={isEmbedOpen}
        nodes={nodes}
        edges={edges}
        onClose={() => setIsEmbedOpen(false)}
      />

      {/* AI Prompt-to-Architecture Modal */}
      <AiGeneratorModal
        isOpen={isAiGenOpen}
        onClose={() => setIsAiGenOpen(false)}
        onApplyArchitecture={handleApplyAiArchitecture}
      />

      {/* Cloud & Local Projects Manager */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        nodes={nodes}
        edges={edges}
        onClose={() => setIsProjectsOpen(false)}
        onLoadProject={handleLoadSavedProject}
      />

      {/* SaaS Pricing & Upgrade Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </div>
  );
};
