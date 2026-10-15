import { GraphNode, GraphEdge } from '../types/graph';
import { analyzeTopologyDiagnostics } from './simulationPhysics';

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
  const diagnostics = analyzeTopologyDiagnostics(nodes, edges);
  
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

  md += `\n## 3. Capacity, Critical Path & SLA Diagnostics\n\n`;
  md += `- **Composite End-to-End SLA:** \`${diagnostics.compositeSlaPercent}%\`\n`;
  md += `- **Critical Path Latency (Worst-Case Hop Chain):** \`${diagnostics.criticalPathLatencyMs}ms\` (${diagnostics.criticalPathTitles.map(sanitizeLabel).join(' -> ') || 'N/A'})\n`;
  if (diagnostics.bottleneckNode) {
    md += `- **Primary Throughput Bottleneck:** **${sanitizeLabel(diagnostics.bottleneckNode.title)}** (Effective Ceiling: \`${diagnostics.bottleneckNode.effectiveCapacityRps} RPS\` at fan-in \`${diagnostics.bottleneckNode.inboundFanIn}\`)\n`;
  }
  if (diagnostics.spofWarnings.length > 0) {
    md += `\n### Topology Risk Advisories\n`;
    diagnostics.spofWarnings.forEach(w => {
      md += `- ${sanitizeLabel(w)}\n`;
    });
  }

  return md;
}

export function exportMarkdownFile(nodes: GraphNode[], edges: GraphEdge[], name = 'architecture') {
  const sanitizedName = sanitizeLabel(name) || 'architecture';
  const content = generateMarkdownDoc(nodes, edges, sanitizedName);
  downloadFile(`${sanitizedName}-spec.md`, content, 'text/markdown');
}

/**
 * Generates production-grade docker-compose.yml from visual architecture nodes and edges.
 */
export function generateDockerCompose(nodes: GraphNode[], edges: GraphEdge[], name = 'graphflow'): string {
  const safeProject = sanitizeLabel(name).toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'graphflow';
  
  let yml = `# ==========================================================================\n`;
  yml += `# Docker Compose Topology for ${safeProject}\n`;
  yml += `# Generated by GraphFlow Architecture Engine\n`;
  yml += `# ==========================================================================\n\n`;
  yml += `version: '3.8'\n\n`;
  yml += `networks:\n`;
  yml += `  ${safeProject}-net:\n`;
  yml += `    driver: bridge\n\n`;
  yml += `services:\n`;

  nodes.forEach(n => {
    const sName = n.id.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const downstream = edges
      .filter(e => e.fromNodeId === n.id)
      .map(e => e.toNodeId.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));

    yml += `  ${sName}:\n`;
    yml += `    container_name: ${safeProject}_${sName}\n`;

    if (n.type === 'database') {
      yml += `    image: postgres:16-alpine\n`;
      yml += `    restart: always\n`;
      yml += `    environment:\n`;
      yml += `      POSTGRES_DB: app_db\n`;
      yml += `      POSTGRES_USER: graphflow_user\n`;
      yml += `      POSTGRES_PASSWORD: \${DB_PASSWORD:-secure_db_pass_123}\n`;
      yml += `    ports:\n`;
      yml += `      - "5432:5432"\n`;
      yml += `    volumes:\n`;
      yml += `      - ${sName}_data:/var/lib/postgresql/data\n`;
    } else if (n.type === 'cache') {
      yml += `    image: redis:7-alpine\n`;
      yml += `    restart: always\n`;
      yml += `    command: redis-server --appendonly yes --requirepass \${REDIS_PASSWORD:-redis_pass_123}\n`;
      yml += `    ports:\n`;
      yml += `      - "6379:6379"\n`;
    } else if (n.type === 'queue') {
      yml += `    image: confluentinc/cp-kafka:7.5.0\n`;
      yml += `    restart: always\n`;
      yml += `    environment:\n`;
      yml += `      KAFKA_NODE_ID: 1\n`;
      yml += `      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT'\n`;
      yml += `      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://${sName}:9092'\n`;
      yml += `      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1\n`;
      yml += `    ports:\n`;
      yml += `      - "9092:9092"\n`;
    } else if (n.type === 'storage') {
      yml += `    image: minio/minio:latest\n`;
      yml += `    restart: always\n`;
      yml += `    command: server /data --console-address ":9001"\n`;
      yml += `    ports:\n`;
      yml += `      - "9000:9000"\n`;
      yml += `      - "9001:9001"\n`;
    } else if (n.type === 'gateway') {
      yml += `    image: nginx:alpine\n`;
      yml += `    restart: always\n`;
      yml += `    ports:\n`;
      yml += `      - "80:80"\n`;
      yml += `      - "443:443"\n`;
    } else {
      yml += `    build:\n`;
      yml += `      context: ./${sName}\n`;
      yml += `      dockerfile: Dockerfile\n`;
      yml += `    restart: on-failure\n`;
      yml += `    environment:\n`;
      yml += `      NODE_ENV: production\n`;
      yml += `      SERVICE_PORT: 8080\n`;
    }

    if (downstream.length > 0) {
      yml += `    depends_on:\n`;
      downstream.forEach(dep => {
        yml += `      - ${dep}\n`;
      });
    }

    yml += `    networks:\n`;
    yml += `      - ${safeProject}-net\n\n`;
  });

  const dbNodes = nodes.filter(n => n.type === 'database');
  if (dbNodes.length > 0) {
    yml += `volumes:\n`;
    dbNodes.forEach(n => {
      const sName = n.id.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      yml += `  ${sName}_data:\n`;
    });
  }

  return yml;
}

/**
 * Generates Terraform infrastructure code (main.tf) for AWS ECS / RDS / ElastiCache / SQS / S3 / Lambda / API Gateway.
 */
export function generateTerraform(nodes: GraphNode[], edges: GraphEdge[], name = 'graphflow'): string {
  const safeProject = sanitizeLabel(name).toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'graphflow';

  let tf = `# ==========================================================================\n`;
  tf += `# Terraform AWS Infrastructure for ${safeProject}\n`;
  tf += `# Generated by GraphFlow Architecture Engine\n`;
  tf += `# ==========================================================================\n\n`;
  tf += `terraform {\n`;
  tf += `  required_version = ">= 1.5.0"\n`;
  tf += `  required_providers {\n`;
  tf += `    aws = {\n`;
  tf += `      source  = "hashicorp/aws"\n`;
  tf += `      version = "~> 5.0"\n`;
  tf += `    }\n`;
  tf += `  }\n`;
  tf += `}\n\n`;
  tf += `provider "aws" {\n`;
  tf += `  region = var.aws_region\n`;
  tf += `}\n\n`;
  tf += `variable "aws_region" {\n`;
  tf += `  default = "us-east-1"\n`;
  tf += `}\n\n`;
  tf += `resource "aws_vpc" "${safeProject}_vpc" {\n`;
  tf += `  cidr_block           = "10.0.0.0/16"\n`;
  tf += `  enable_dns_hostnames = true\n`;
  tf += `  tags = { Name = "${safeProject}-vpc" }\n`;
  tf += `}\n\n`;
  tf += `resource "aws_ecs_cluster" "${safeProject}_cluster" {\n`;
  tf += `  name = "${safeProject}-ecs-cluster"\n`;
  tf += `}\n\n`;

  nodes.forEach(n => {
    const sName = n.id.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (n.type === 'database') {
      tf += `resource "aws_db_instance" "${sName}" {\n`;
      tf += `  identifier          = "${safeProject}-${sName}"\n`;
      tf += `  allocated_storage   = 20\n`;
      tf += `  engine              = "postgres"\n`;
      tf += `  engine_version      = "16.1"\n`;
      tf += `  instance_class      = "db.t4g.micro"\n`;
      tf += `  db_name             = "app_db"\n`;
      tf += `  skip_final_snapshot = true\n`;
      tf += `}\n\n`;
    } else if (n.type === 'cache') {
      tf += `resource "aws_elasticache_cluster" "${sName}" {\n`;
      tf += `  cluster_id           = "${safeProject}-${sName}"\n`;
      tf += `  engine               = "redis"\n`;
      tf += `  node_type            = "cache.t4g.micro"\n`;
      tf += `  num_cache_nodes      = 1\n`;
      tf += `  parameter_group_name = "default.redis7"\n`;
      tf += `}\n\n`;
    } else if (n.type === 'queue') {
      tf += `resource "aws_sqs_queue" "${sName}" {\n`;
      tf += `  name                      = "${safeProject}-${sName}"\n`;
      tf += `  message_retention_seconds = 86400\n`;
      tf += `  visibility_timeout_seconds = ${Math.max(30, Math.round(n.latencyMs / 10))}\n`;
      tf += `}\n\n`;
    } else if (n.type === 'storage') {
      tf += `resource "aws_s3_bucket" "${sName}" {\n`;
      tf += `  bucket = "${safeProject}-${sName.replace(/_/g, '-')}"\n`;
      tf += `}\n\n`;
    } else if (n.type === 'serverless') {
      tf += `resource "aws_lambda_function" "${sName}" {\n`;
      tf += `  function_name = "${safeProject}-${sName}"\n`;
      tf += `  runtime       = "nodejs20.x"\n`;
      tf += `  handler       = "index.handler"\n`;
      tf += `  timeout       = ${Math.max(5, Math.ceil(n.latencyMs / 100))}\n`;
      tf += `}\n\n`;
    } else {
      const replicas = Math.max(2, Math.min(12, Math.ceil((n.throughputRps || 500) / 400)));
      tf += `resource "aws_ecs_service" "${sName}_svc" {\n`;
      tf += `  name            = "${sName}"\n`;
      tf += `  cluster         = aws_ecs_cluster.${safeProject}_cluster.id\n`;
      tf += `  launch_type     = "FARGATE"\n`;
      tf += `  desired_count   = ${replicas}\n`;
      tf += `  task_definition = "${sName}-task"\n`;
      tf += `}\n\n`;
    }
  });

  if (edges.length > 0) {
    tf += `# Security Group ingress rules inferred from architecture pipelines\n`;
    edges.forEach((edge, idx) => {
      const from = edge.fromNodeId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const to = edge.toNodeId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      tf += `resource "aws_security_group_rule" "allow_${from}_to_${to}_${idx}" {\n`;
      tf += `  type              = "ingress"\n`;
      tf += `  from_port         = 80\n`;
      tf += `  to_port           = 8080\n`;
      tf += `  protocol          = "tcp"\n`;
      tf += `  cidr_blocks       = ["10.0.0.0/16"]\n`;
      tf += `  security_group_id = "${to}_sg"\n`;
      tf += `  description       = "Pipeline ${edge.protocol} from ${from}"\n`;
      tf += `}\n\n`;
    });
  }

  return tf;
}

export function exportDockerComposeFile(nodes: GraphNode[], edges: GraphEdge[], name = 'graphflow') {
  const sanitizedName = sanitizeLabel(name) || 'graphflow';
  const content = generateDockerCompose(nodes, edges, sanitizedName);
  downloadFile('docker-compose.yml', content, 'application/x-yaml');
}

export function exportTerraformFile(nodes: GraphNode[], edges: GraphEdge[], name = 'graphflow') {
  const sanitizedName = sanitizeLabel(name) || 'graphflow';
  const content = generateTerraform(nodes, edges, sanitizedName);
  downloadFile('main.tf', content, 'text/plain');
}
