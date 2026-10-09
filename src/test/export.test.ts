import { describe, it, expect } from 'vitest';
import { generateMarkdownDoc } from '../utils/export';
import { GraphNode, GraphEdge } from '../types/graph';

describe('Export & Documentation Generator', () => {
  const nodes: GraphNode[] = [
    {
      id: 'n1',
      type: 'client',
      title: 'Frontend Client',
      subtitle: 'React App',
      x: 0,
      y: 0,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 15,
      errorRate: 0,
      throughputRps: 100,
      color: '#38bdf8',
      iconName: 'Globe',
    },
    {
      id: 'n2',
      type: 'gateway',
      title: 'API Gateway',
      subtitle: 'Envoy',
      x: 300,
      y: 0,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 5,
      errorRate: 0.1,
      throughputRps: 1000,
      color: '#818cf8',
      iconName: 'Network',
    }
  ];

  const edges: GraphEdge[] = [
    {
      id: 'e1',
      fromNodeId: 'n1',
      toNodeId: 'n2',
      protocol: 'HTTP/REST',
      latencyMs: 10,
      errorRate: 0,
      label: '/api/v1',
    }
  ];

  it('generates valid Markdown with component count and table', () => {
    const md = generateMarkdownDoc(nodes, edges, 'E-Commerce');
    expect(md).toContain('# E-Commerce Architecture');
    expect(md).toContain('**2 components**');
    expect(md).toContain('**1 communication pipelines**');
    expect(md).toContain('| **Frontend Client** (React App) |');
    expect(md).toContain('| **API Gateway** (Envoy) |');
  });

  it('generates embedded Mermaid diagram with clean syntax', () => {
    const md = generateMarkdownDoc(nodes, edges);
    expect(md).toContain('```mermaid\ngraph LR');
    expect(md).toContain('n1["Frontend Client (React App)"]');
    expect(md).toContain('n1 -->|"/api/v1"| n2');
  });
});
