import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateDockerCompose, generateTerraform } from '../utils/export';
import {
  MultiplayerPresenceManager,
  getOrCreateLocalPersona,
} from '../services/multiplayerPresence';
import { GraphNode, GraphEdge } from '../types/graph';

describe('Infrastructure as Code (IaC) Generator Suite', () => {
  const nodes: GraphNode[] = [
    {
      id: 'gateway',
      type: 'gateway',
      title: 'API Gateway',
      subtitle: 'Nginx',
      x: 0,
      y: 0,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 5,
      errorRate: 0,
      throughputRps: 1200,
      color: '#38bdf8',
      iconName: 'Globe',
    },
    {
      id: 'auth_service',
      type: 'service',
      title: 'Auth Service',
      subtitle: 'NodeJS',
      x: 300,
      y: 0,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 25,
      errorRate: 0.01,
      throughputRps: 450,
      color: '#818cf8',
      iconName: 'Cpu',
    },
    {
      id: 'users_db',
      type: 'database',
      title: 'Users Database',
      subtitle: 'PostgreSQL',
      x: 600,
      y: 0,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 12,
      errorRate: 0,
      throughputRps: 800,
      color: '#34d399',
      iconName: 'Database',
    },
    {
      id: 'session_cache',
      type: 'cache',
      title: 'Session Cache',
      subtitle: 'Redis',
      x: 600,
      y: 150,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 2,
      errorRate: 0,
      throughputRps: 2000,
      color: '#f59e0b',
      iconName: 'Zap',
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: 'e1',
      fromNodeId: 'gateway',
      toNodeId: 'auth_service',
      protocol: 'HTTP/REST',
      latencyMs: 10,
      errorRate: 0,
    },
    {
      id: 'e2',
      fromNodeId: 'auth_service',
      toNodeId: 'users_db',
      protocol: 'gRPC',
      latencyMs: 5,
      errorRate: 0,
    },
    {
      id: 'e3',
      fromNodeId: 'auth_service',
      toNodeId: 'session_cache',
      protocol: 'TCP',
      latencyMs: 2,
      errorRate: 0,
    },
  ];

  it('generates production-grade docker-compose.yml with services, ports, and volumes', () => {
    const yml = generateDockerCompose(nodes, edges, 'AcmeCorp');

    expect(yml).toContain('Docker Compose Topology for acmecorp');
    expect(yml).toContain("version: '3.8'");
    expect(yml).toContain('acmecorp-net:');

    // Database service verification
    expect(yml).toContain('users_db:');
    expect(yml).toContain('image: postgres:16-alpine');
    expect(yml).toContain('- "5432:5432"');
    expect(yml).toContain('users_db_data:/var/lib/postgresql/data');

    // Cache service verification
    expect(yml).toContain('session_cache:');
    expect(yml).toContain('image: redis:7-alpine');
    expect(yml).toContain('- "6379:6379"');

    // Microservice dependencies
    expect(yml).toContain('auth_service:');
    expect(yml).toContain('depends_on:');
    expect(yml).toContain('- users_db');
    expect(yml).toContain('- session_cache');

    // Volumes block at root
    expect(yml).toContain('volumes:\n  users_db_data:');
  });

  it('generates robust Terraform AWS infrastructure code', () => {
    const tf = generateTerraform(nodes, edges, 'CloudBank');

    expect(tf).toContain('Terraform AWS Infrastructure for cloudbank');
    expect(tf).toContain('provider "aws"');
    expect(tf).toContain('resource "aws_vpc" "cloudbank_vpc"');
    expect(tf).toContain('resource "aws_ecs_cluster" "cloudbank_cluster"');

    // RDS instance verification
    expect(tf).toContain('resource "aws_db_instance" "users_db"');
    expect(tf).toContain('engine              = "postgres"');
    expect(tf).toContain('instance_class      = "db.t4g.micro"');

    // ElastiCache cluster verification
    expect(tf).toContain('resource "aws_elasticache_cluster" "session_cache"');
    expect(tf).toContain('engine               = "redis"');

    // ECS Fargate microservice
    expect(tf).toContain('resource "aws_ecs_service" "auth_service_svc"');
    expect(tf).toContain('launch_type     = "FARGATE"');
  });
});

describe('Real-Time Multiplayer Presence & Collaboration Engine', () => {
  let manager: MultiplayerPresenceManager;

  beforeEach(() => {
    manager = new MultiplayerPresenceManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('creates and returns consistent local peer persona', () => {
    const persona = getOrCreateLocalPersona();
    expect(persona.id).toBeDefined();
    expect(typeof persona.name).toBe('string');
    expect(persona.color).toMatch(/^#[0-9a-fA-F]{6}$/);

    const localPresence = manager.getLocalPresence();
    expect(localPresence.id).toBe(persona.id);
    expect(localPresence.name).toBe(persona.name);
    expect(localPresence.color).toBe(persona.color);
    expect(localPresence.cursor).toBeNull();
  });

  it('updates and clears local cursor position in canvas world coordinates', () => {
    manager.updateCursor(240.4, 450.8);
    let presence = manager.getLocalPresence();
    expect(presence.cursor).toEqual({ x: 240, y: 451 });

    manager.clearCursor();
    presence = manager.getLocalPresence();
    expect(presence.cursor).toBeNull();
  });

  it('updates selected node for peer inspection state', () => {
    manager.updateSelectedNode('node-db-primary');
    const presence = manager.getLocalPresence();
    expect(presence.selectedNodeId).toBe('node-db-primary');
  });

  it('registers incoming remote peers and notifies subscribers', () => {
    const remotePeersList: any[] = [];
    manager.subscribe(peers => {
      remotePeersList.push(peers);
    });

    const mockRemotePeer = {
      id: 'peer-collaborator-99',
      name: 'Architect-88',
      color: '#a855f7',
      cursor: { x: 500, y: 300 },
      selectedNodeId: 'users_db',
      lastActive: Date.now(),
    };

    manager.handleIncomingMessage({
      type: 'presence:update',
      peer: mockRemotePeer,
    });

    const remotePeers = manager.getRemotePeers();
    expect(remotePeers.length).toBe(1);
    expect(remotePeers[0].id).toBe('peer-collaborator-99');
    expect(remotePeers[0].name).toBe('Architect-88');
    expect(remotePeers[0].cursor).toEqual({ x: 500, y: 300 });
  });

  it('removes remote peer when receiving leave message', () => {
    manager.handleIncomingMessage({
      type: 'presence:update',
      peer: {
        id: 'peer-leaver-1',
        name: 'DevOps-42',
        color: '#10b981',
        cursor: null,
        selectedNodeId: null,
        lastActive: Date.now(),
      },
    });

    expect(manager.getRemotePeers().length).toBe(1);

    manager.handleIncomingMessage({
      type: 'presence:leave',
      id: 'peer-leaver-1',
    });

    expect(manager.getRemotePeers().length).toBe(0);
  });

  it('prunes stale peers that have timed out beyond threshold', () => {
    manager.handleIncomingMessage({
      type: 'presence:update',
      peer: {
        id: 'peer-stale-9',
        name: 'SRE-01',
        color: '#f43f5e',
        cursor: null,
        selectedNodeId: null,
        lastActive: Date.now() - 10000, // 10s ago, threshold is 8s
      },
    });

    // Manually trigger pruning
    manager.pruneStalePeers();

    expect(manager.getRemotePeers().length).toBe(0);
  });
});
