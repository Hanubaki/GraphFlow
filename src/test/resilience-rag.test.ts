import { describe, it, expect } from 'vitest';
import { synthesizeArchitectureOffline } from '../services/aiGenerator';
import { GraphNode, DataPacket } from '../types/graph';

describe('Distributed Systems Resilience & LLM-RAG Generator Suite', () => {
  describe('1. Domain RAG & NLP Architecture Synthesizer', () => {
    it('synthesizes Fintech Payment Gateway with DLQ and Circuit Breaker', () => {
      const result = synthesizeArchitectureOffline('Need a high-scale fintech payment gateway with fraud check and stripe');

      expect(result.title).toContain('Fintech Payment');
      expect(result.nodes.length).toBeGreaterThan(3);

      const paymentSvc = result.nodes.find(n => n.id === 'service-core');
      expect(paymentSvc).toBeDefined();
      expect(paymentSvc?.circuitBreaker).toBe('closed');
      expect(paymentSvc?.title).toContain('Payment Engine');

      const dlqNode = result.nodes.find(n => n.id === 'queue-dlq');
      expect(dlqNode).toBeDefined();
      expect(dlqNode?.title).toContain('Dead-Letter Queue');

      const stripeNode = result.nodes.find(n => n.id === 'ext-stripe');
      expect(stripeNode).toBeDefined();
      expect(stripeNode?.type).toBe('external');
    });

    it('synthesizes Industrial IoT Ingestion with stream processor', () => {
      const result = synthesizeArchitectureOffline('Build an IoT sensor telemetry cluster with real-time stream processing');

      expect(result.title).toContain('IoT');
      const streamEngine = result.nodes.find(n => n.title.includes('Stream Engine'));
      expect(streamEngine).toBeDefined();
    });

    it('synthesizes AI Multi-Agent & RAG topology', () => {
      const result = synthesizeArchitectureOffline('create an AI RAG pipeline with vector db and gemini llm');

      expect(result.title).toContain('RAG');
      const vectorDb = result.nodes.find(n => n.id === 'db-vector');
      expect(vectorDb).toBeDefined();
      expect(vectorDb?.type).toBe('database');
    });
  });

  describe('2. Distributed Systems Resilience: Circuit Breaker & DLQ Contracts', () => {
    it('supports closed, open, and half-open circuit breaker states on GraphNode', () => {
      const node: GraphNode = {
        id: 'node-test',
        type: 'service',
        title: 'Order Service',
        subtitle: 'Core API',
        x: 100,
        y: 100,
        width: 190,
        height: 90,
        status: 'degraded',
        circuitBreaker: 'open',
        latencyMs: 120,
        errorRate: 15,
        throughputRps: 500,
        color: '#f43f5e',
        iconName: 'Server',
      };

      expect(node.circuitBreaker).toBe('open');
      node.circuitBreaker = 'half-open';
      expect(node.circuitBreaker).toBe('half-open');
      node.circuitBreaker = 'closed';
      expect(node.circuitBreaker).toBe('closed');
    });

    it('supports dlq packet status for poison message isolation', () => {
      const pkt: DataPacket = {
        id: 'pkt-dlq-1',
        edgeId: 'e-1',
        fromNodeId: 'node-1',
        toNodeId: 'node-2',
        progress: 0.5,
        speed: 0.01,
        status: 'dlq',
        label: 'DLQ/Trip',
        createdAt: Date.now(),
      };

      expect(pkt.status).toBe('dlq');
      expect(pkt.label).toContain('DLQ');
    });
  });
});
