import { CatalogItem } from '../constants/nodeCatalog';
import { GraphNode } from '../types/graph';

/**
 * Creates a new GraphNode domain instance initialized from a catalog item and canvas coordinates.
 */
export function createNodeFromCatalog(
  item: CatalogItem,
  position: { x: number; y: number }
): GraphNode {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    x: position.x,
    y: position.y,
    width: 190,
    height: 90,
    status: 'healthy',
    latencyMs: item.defaultLatencyMs,
    errorRate: item.defaultErrorRate,
    throughputRps: item.defaultThroughput,
    color: item.color,
    iconName: item.iconName,
  };
}
