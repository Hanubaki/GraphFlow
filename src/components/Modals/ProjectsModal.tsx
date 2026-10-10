import React, { useState, useEffect, useCallback } from 'react';
import { GraphNode, GraphEdge } from '../../types/graph';
import {
  getSavedProjects,
  saveProject,
  deleteSavedProject,
  generateShareUrl,
  SavedProject,
} from '../../services/projectStorage';
import {
  fetchCloudProjects,
  saveCloudProject,
  deleteCloudProject,
} from '../../services/supabase';
import { CloudProject } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban,
  Save,
  Trash2,
  Share2,
  Copy,
  Check,
  X,
  ArrowRight,
  Cloud,
  HardDrive,
  LogIn,
  Loader2,
} from 'lucide-react';

interface ProjectsModalProps {
  isOpen: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
  onLoadProject: (project: SavedProject | CloudProject) => void;
  onOpenAuth?: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  nodes,
  edges,
  onClose,
  onLoadProject,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>(user ? 'cloud' : 'local');
  const [localProjects, setLocalProjects] = useState<SavedProject[]>([]);
  const [cloudProjects, setCloudProjects] = useState<CloudProject[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadCloud = useCallback(async () => {
    if (!user) return;
    setIsLoadingCloud(true);
    try {
      const data = await fetchCloudProjects(user.id);
      setCloudProjects(data);
    } finally {
      setIsLoadingCloud(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setLocalProjects(getSavedProjects());
      if (user) {
        loadCloud();
      }
    }
  }, [isOpen, user, loadCloud]);

  // Accessibility: close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (activeTab === 'cloud' && user) {
      setIsSaving(true);
      try {
        const saved = await saveCloudProject(user.id, newTitle, nodes, edges, newDesc);
        if (saved) {
          setCloudProjects(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);
          setNewTitle('');
          setNewDesc('');
        }
      } finally {
        setIsSaving(false);
      }
    } else {
      const saved = saveProject(newTitle, nodes, edges, newDesc);
      setLocalProjects([saved, ...localProjects.filter(p => p.id !== saved.id)]);
      setNewTitle('');
      setNewDesc('');
    }
  };

  const handleDeleteLocal = (id: string) => {
    deleteSavedProject(id);
    setLocalProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteCloud = async (id: string) => {
    if (!user) return;
    const ok = await deleteCloudProject(id, user.id);
    if (ok) {
      setCloudProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleCopyLink = (projNodes: GraphNode[], projEdges: GraphEdge[], id: string) => {
    const url = generateShareUrl(projNodes, projEdges);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCurrentLink = () => {
    const url = generateShareUrl(nodes, edges);
    navigator.clipboard.writeText(url);
    setCopiedId('current');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="projects-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none"
    >
      <div className="bg-dark-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 id="projects-modal-title" className="text-base font-bold text-slate-100">Project Manager & Cloud Sharing</h2>
              <p className="text-xs text-slate-400">Save designs, sync to database, or copy instant share links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            aria-label="Close projects modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Quick Share Current Canvas */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Zero-Cost Live Share Link
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Generates a compressed URL containing the entire active architecture state. Anyone opening it sees your exact simulation!
              </p>
            </div>
            <button
              onClick={handleCopyCurrentLink}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-md shadow-cyan-950 cursor-pointer"
            >
              {copiedId === 'current' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'current' ? 'Copied Link!' : 'Copy Share Link'}</span>
            </button>
          </div>

          {/* Storage Mode Toggle Tabs */}
          <div role="tablist" aria-label="Storage mode tabs" className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-950 border border-slate-800 text-xs font-semibold">
            <button
              role="tab"
              aria-selected={activeTab === 'cloud'}
              onClick={() => setActiveTab('cloud')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                activeTab === 'cloud'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cloud Database Sync {user ? `(${cloudProjects.length})` : ''}</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'local'}
              onClick={() => setActiveTab('local')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                activeTab === 'local'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Local Storage ({localProjects.length})</span>
            </button>
          </div>

          {/* If Cloud Tab Selected but User Not Signed In */}
          {activeTab === 'cloud' && !user ? (
            <div className="p-6 rounded-2xl border border-slate-800 bg-dark-950/60 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center mx-auto text-cyan-400">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Sign in to Access Cloud Sync</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Connect your account to store architectures in PostgreSQL, sync changes across your devices, and share live systems with your team.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth?.();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In or Create Free Account</span>
              </button>
            </div>
          ) : (
            <>
              {/* Save Current Architecture Form */}
              <form onSubmit={handleSaveCurrent} className="space-y-3 p-4 rounded-xl border border-slate-800 bg-dark-950/60">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  Save Active Canvas to {activeTab === 'cloud' ? 'Cloud Database' : 'Local Storage'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Architecture Title (e.g. Distributed Payment Engine)"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="sm:col-span-2 bg-dark-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={!newTitle.trim() || isSaving}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{isSaving ? 'Saving...' : 'Save Architecture'}</span>
                  </button>
                </div>
              </form>

              {/* Projects List */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {activeTab === 'cloud' ? `Cloud Architectures (${cloudProjects.length})` : `Local Architectures (${localProjects.length})`}
                </span>

                {activeTab === 'cloud' && isLoadingCloud ? (
                  <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Querying Supabase database...</span>
                  </div>
                ) : (activeTab === 'cloud' ? cloudProjects.length === 0 : localProjects.length === 0) ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No {activeTab} architectures saved yet. Use the form above to save your first system design!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(activeTab === 'cloud' ? cloudProjects : localProjects).map((proj: any) => (
                      <div
                        key={proj.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-dark-950/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                            {proj.title}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{new Date(proj.updatedAt || proj.updated_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-cyan-400">{proj.nodes.length} nodes</span>
                            <span>•</span>
                            <span>{proj.edges.length} pipelines</span>
                            {activeTab === 'cloud' && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">Cloud Synced</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Copy Share Link */}
                          <button
                            onClick={() => handleCopyLink(proj.nodes, proj.edges, proj.id)}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy Share Link"
                          >
                            {copiedId === proj.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Open Project */}
                          <button
                            onClick={() => {
                              onLoadProject(proj);
                              onClose();
                            }}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (activeTab === 'cloud') {
                                handleDeleteCloud(proj.id);
                              } else {
                                handleDeleteLocal(proj.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-transparent hover:border-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
