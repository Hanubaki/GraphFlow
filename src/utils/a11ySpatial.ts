/**
 * Spatial Directional Navigation Mathematics for Keyboard Accessibility (WCAG 2.1 AA).
 * Determines adjacent nodes based on geometric directional vectors and cycle ordering.
 */

import { GraphNode } from '../types/graph';

export type SpatialDirection = 'left' | 'right' | 'up' | 'down';

export function findAdjacentNodeInDirection(
  currentNode: GraphNode,
  allNodes: GraphNode[],
  direction: SpatialDirection
): GraphNode | null {
  const otherNodes = allNodes.filter(n => n.id !== currentNode.id);
  if (otherNodes.length === 0) return null;

  let bestNode: GraphNode | null = null;
  let minCost = Infinity;

  for (const candidate of otherNodes) {
    const dx = candidate.x - currentNode.x;
    const dy = candidate.y - currentNode.y;

    let inDirection = false;
    let cost = Infinity;

    switch (direction) {
      case 'right':
        if (dx > 10) {
          inDirection = true;
          cost = dx + Math.abs(dy) * 1.8;
        }
        break;

      case 'left':
        if (dx < -10) {
          inDirection = true;
          cost = Math.abs(dx) + Math.abs(dy) * 1.8;
        }
        break;

      case 'down':
        if (dy > 10) {
          inDirection = true;
          cost = dy + Math.abs(dx) * 1.8;
        }
        break;

      case 'up':
        if (dy < -10) {
          inDirection = true;
          cost = Math.abs(dy) + Math.abs(dx) * 1.8;
        }
        break;
    }

    if (inDirection && cost < minCost) {
      minCost = cost;
      bestNode = candidate;
    }
  }

  return bestNode;
}

export function getNextNodeInCycle(
  allNodes: GraphNode[],
  currentId: string | null,
  reverse = false
): GraphNode | null {
  if (allNodes.length === 0) return null;
  if (!currentId) return allNodes[0];

  const currentIndex = allNodes.findIndex(n => n.id === currentId);
  if (currentIndex === -1) return allNodes[0];

  if (reverse) {
    const prevIndex = (currentIndex - 1 + allNodes.length) % allNodes.length;
    return allNodes[prevIndex];
  } else {
    const nextIndex = (currentIndex + 1) % allNodes.length;
    return allNodes[nextIndex];
  }
}
