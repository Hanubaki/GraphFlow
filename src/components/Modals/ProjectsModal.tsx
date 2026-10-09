import React, { useState, useEffect } from 'react';
import { GraphNode, GraphEdge } from '../../types/graph';
import {
  getSavedProjects,
  saveProject,
  deleteSavedProject,
  generateShareUrl,
  SavedProject,
} from '../../services/projectStorage';
import {
  FolderKanban,
  Save,
  Trash2,
  Share2,
  Copy,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';

interface ProjectsModalProps {
  isOpen: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
  onLoadProject: (project: SavedProject) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  nodes,
  edges,
  onClose,
  onLoadProject,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjects(getSavedProjects());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const saved = saveProject(newTitle, nodes, edges, newDesc);
    setProjects([saved, ...projects.filter(p => p.id !== saved.id)]);
    setNewTitle('');
    setNewDesc('');
  };

  const handleDelete = (id: string) => {
    deleteSavedProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleCopyLink = (proj: SavedProject) => {
    const url = generateShareUrl(proj.nodes, proj.edges);
    navigator.clipboard.writeText(url);
    setCopiedId(proj.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCurrentLink = () => {
    const url = generateShareUrl(nodes, edges);
    navigator.clipboard.writeText(url);
    setCopiedId('current');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <div className="bg-dark-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Project Manager & Cloud Sharing</h2>
              <p className="text-xs text-slate-400">Save designs, manage architectures, or copy instant share links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
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
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-md shadow-cyan-950"
            >
              {copiedId === 'current' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'current' ? 'Copied Link!' : 'Copy Share Link'}</span>
            </button>
          </div>

          {/* Save Current Architecture Form */}
          <form onSubmit={handleSaveCurrent} className="space-y-3 p-4 rounded-xl border border-slate-800 bg-dark-950/60">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              Save Active Architecture
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Architecture Title (e.g. Stripe Payment Flow)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="sm:col-span-2 bg-dark-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                Save Project
              </button>
            </div>
          </form>

          {/* Saved Projects List */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Saved Architectures ({projects.length})
            </span>

            {projects.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No saved projects yet. Save your current canvas above!
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(proj => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-dark-950/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                        {proj.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{proj.nodes.length} nodes</span>
                        <span>•</span>
                        <span>{proj.edges.length} pipelines</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Copy Share Link */}
                      <button
                        onClick={() => handleCopyLink(proj)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
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
                        className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 text-xs font-semibold transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(proj.id)}
                        className="p-1.5 rounded-lg border border-transparent hover:border-rose-900/50 text-slate-500 hover:text-rose-400 transition-colors"
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
        </div>
      </div>
    </div>
  );
};
