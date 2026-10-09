---
name: llm-rag-pipeline
description: >-
  LLM prompt engineering, Retrieval-Augmented Generation (RAG), vector embeddings, semantic search,
  streaming completions, and structured function/tool calling. Use when building AI features, prompts, or LLM integrations.
---

# LLM & RAG Architecture Runbook

Engineering guidelines for reliable, hallucination-resistant, and high-speed AI pipelines.

## 1. Structured Outputs & Tool Calling

* Always prefer JSON schema or tool calling over freeform markdown parsing when expecting machine-readable payloads.
* Provide clear descriptions for each parameter in your schema to guide model reasoning.
* Validate generated JSON with Zod or TypeScript schema parsers before feeding into downstream systems.

## 2. RAG Chunking & Retrieval Strategies

* **Semantic Chunking:** Chunk by logical boundaries (markdown headings, functions, paragraphs) rather than raw arbitrary token splits (e.g. 512 tokens with 50-token overlap).
* **Hybrid Search:** Combine sparse lexical search (BM25) with dense vector search (cosine similarity on embedding vectors) for maximum recall.
* **Context Budget:** Never exceed 40% of the model's context window with retrieved chunks to preserve space for reasoning and few-shot examples.

## 3. Streaming UX & Error Resilience

* Stream responses chunk-by-chunk using `ReadableStream` and server-sent events (SSE).
* Implement client-side speculative rendering and typing animations.
* Fallback smoothly on rate limit (HTTP 429) using exponential backoff with jitter.
