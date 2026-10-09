import { GraphNode, GraphEdge } from '../types/graph';

/**
 * Sanitizes input text by replacing quotes, stripping HTML/script tags,
 * and normalizing control characters to prevent Markdown & Mermaid diagram injections.
 */
export function sanitizeLabel(input: string = ''): string {
  if (!input) return '';
  return String(input)
    .replace(/["`]/g, "'")
    .replace(/[<>]/g, '')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
}

/**
 * Escapes XML/HTML entities for SVG and XML exports.
 */
export function escapeXml(input: string = ''): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportArchitectureJson(nodes: GraphNode[], edges: GraphEdge[], name = 'graphflow-architecture') {
  const sanitizedName = sanitizeLabel(name) || 'graphflow-architecture';
  const data = {
    version: '1.0',
    name: sanitizedName,
    exportedAt: new Date().toISOString(),
    nodes,
    edges,
  };
  downloadFile(`${sanitizedName}.json`, JSON.stringify(data, null, 2), 'application/json');
}

export function generateMarkdownDoc(nodes: GraphNode[], edges: GraphEdge[], name = 'System Architecture'): string {
  const date = new Date().toLocaleDateString();
  const safeName = sanitizeLabel(name) || 'System Architecture';
  
  let md = `# ${safeName} Architecture\n\n`;
  md += `*Generated automatically by [GraphFlow](https://github.com/Hanubaki/GraphFlow) on ${date}*\n\n`;
  
  md += `## 1. System Overview\n\n`;
  md += `The system consists of **${nodes.length} components** interconnected through **${edges.length} communication pipelines**.\n\n`;
  
  md += `### Components Breakdown\n\n`;
  md += `| Component | Type | Latency (ms) | Error Rate (%) | Est. Throughput (RPS) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  nodes.forEach(n => {
    const title = sanitizeLabel(n.title);
    const subtitle = sanitizeLabel(n.subtitle);
    md += `| **${title}** (${subtitle}) | \`${n.type}\` | ${n.latencyMs}ms | ${n.errorRate}% | ${n.throughputRps} rps |\n`;
  });
  
  md += `\n### Communication & Data Pipelines\n\n`;
  md += `| Source | Target | Protocol | Pipeline Latency | Label / Route |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  edges.forEach(e => {
    const from = sanitizeLabel(nodes.find(n => n.id === e.fromNodeId)?.title || e.fromNodeId);
    const to = sanitizeLabel(nodes.find(n => n.id === e.toNodeId)?.title || e.toNodeId);
    const label = sanitizeLabel(e.label || 'N/A');
    md += `| ${from} | ${to} | \`${e.protocol}\` | ${e.latencyMs}ms | ${label} |\n`;
  });

  md += `\n## 2. Mermaid Diagram\n\n`;
  md += `\`\`\`mermaid\ngraph LR\n`;
  nodes.forEach(n => {
    const cleanId = n.id.replace(/[^a-zA-Z0-9_]/g, '_');
    const title = sanitizeLabel(n.title);
    const subtitle = sanitizeLabel(n.subtitle);
    md += `  ${cleanId}["${title} (${subtitle})"]\n`;
  });
  edges.forEach(e => {
    const cleanFrom = e.fromNodeId.replace(/[^a-zA-Z0-9_]/g, '_');
    const cleanTo = e.toNodeId.replace(/[^a-zA-Z0-9_]/g, '_');
    const label = e.label ? `|"${sanitizeLabel(e.label)}"|` : '';
    md += `  ${cleanFrom} -->${label} ${cleanTo}\n`;
  });
  md += `\`\`\`\n`;

  return md;
}

export function exportMarkdownFile(nodes: GraphNode[], edges: GraphEdge[], name = 'architecture') {
  const sanitizedName = sanitizeLabel(name) || 'architecture';
  const content = generateMarkdownDoc(nodes, edges, sanitizedName);
  downloadFile(`${sanitizedName}-spec.md`, content, 'text/markdown');
}
