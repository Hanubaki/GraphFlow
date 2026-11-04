import { describe, it, expect } from 'vitest';
import { createNodeFromCatalog } from '../utils/nodeFactory';
import { NODE_CATALOG } from '../constants/nodeCatalog';

describe('Node Factory Unit Tests', () => {
  it('instantiates a valid GraphNode from a catalog item', () => {
    const catalogItem = NODE_CATALOG[0]; // Web Application
    const position = { x: 350, y: 180 };

    const node = createNodeFromCatalog(catalogItem, position);

    expect(node.id).toMatch(/^node-\d+-[a-z0-9]+$/);
    expect(node.type).toBe(catalogItem.type);
    expect(node.title).toBe(catalogItem.title);
    expect(node.subtitle).toBe(catalogItem.subtitle);
    expect(node.x).toBe(350);
    expect(node.y).toBe(180);
    expect(node.width).toBe(190);
    expect(node.height).toBe(90);
    expect(node.status).toBe('healthy');
    expect(node.latencyMs).toBe(catalogItem.defaultLatencyMs);
    expect(node.errorRate).toBe(catalogItem.defaultErrorRate);
    expect(node.throughputRps).toBe(catalogItem.defaultThroughput);
    expect(node.color).toBe(catalogItem.color);
    expect(node.iconName).toBe(catalogItem.iconName);
  });

  it('generates unique IDs across consecutive creations', () => {
    const catalogItem = NODE_CATALOG[1];
    const nodeA = createNodeFromCatalog(catalogItem, { x: 0, y: 0 });
    const nodeB = createNodeFromCatalog(catalogItem, { x: 100, y: 100 });

    expect(nodeA.id).not.toBe(nodeB.id);
  });

  it('partitions 16 catalog components into 6 guest-accessible core nodes and 10 free email-unlocked advanced nodes', () => {
    expect(NODE_CATALOG.length).toBe(16);
    const guestFree = NODE_CATALOG.filter(item => !item.requiresAuth);
    const emailUnlocked = NODE_CATALOG.filter(item => item.requiresAuth);
    expect(guestFree.length).toBe(6);
    expect(emailUnlocked.length).toBe(10);
  });
});
