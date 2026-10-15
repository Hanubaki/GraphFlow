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
  md += `- **Tail Latency Distribution:** \`p95: ${diagnostics.p95LatencyMs}ms\` | \`p99: ${diagnostics.p99LatencyMs}ms\`\n`;
  md += `- **Estimated Monthly Cloud Infra Cost:** \`~$${diagnostics.estimatedMonthlyCostUsd}/mo\`\n`;
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

export function generateKubernetesManifests(
  nodes: GraphNode[],
  edges: GraphEdge[],
  name = 'graphflow'
): string {
  const safeNamespace =
    sanitizeLabel(name)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '') || 'graphflow';

  let k8s = `# ==========================================================================\n`;
  k8s += `# Kubernetes Production Manifests (${safeNamespace})\n`;
  k8s += `# Generated by GraphFlow Architecture Engine\n`;
  k8s += `# ==========================================================================\n`;
  k8s += `apiVersion: v1\nkind: Namespace\nmetadata:\n  name: ${safeNamespace}\n`;

  nodes.forEach(n => {
    if (n.type === 'client' || n.type === 'external') return;
    const sName = n.id
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '') || 'service';
    const minReplicas = Math.max(2, Math.min(8, Math.ceil((n.throughputRps || 400) / 500)));
    const maxReplicas = Math.max(minReplicas + 2, Math.min(24, minReplicas * 3));

    let image = `${safeNamespace}/${sName}:latest`;
    let port = 8080;
    if (n.type === 'database') {
      image = 'postgres:16-alpine';
      port = 5432;
    } else if (n.type === 'cache') {
      image = 'redis:7-alpine';
      port = 6379;
    } else if (n.type === 'queue') {
      image = 'confluentinc/cp-kafka:7.5.0';
      port = 9092;
    } else if (n.type === 'gateway') {
      image = 'envoyproxy/envoy:v1.29-latest';
      port = 80;
    } else if (n.type === 'storage') {
      image = 'minio/minio:latest';
      port = 9000;
    }

    const upstreamCount = edges.filter(e => e.toNodeId === n.id).length;

    k8s += `---\n`;
    k8s += `apiVersion: apps/v1\n`;
    k8s += `kind: Deployment\n`;
    k8s += `metadata:\n`;
    k8s += `  name: ${sName}\n`;
    k8s += `  namespace: ${safeNamespace}\n`;
    k8s += `  labels:\n`;
    k8s += `    app: ${sName}\n`;
    k8s += `    tier: ${n.type}\n`;
    k8s += `spec:\n`;
    k8s += `  replicas: ${minReplicas}\n`;
    k8s += `  selector:\n`;
    k8s += `    matchLabels:\n`;
    k8s += `      app: ${sName}\n`;
    k8s += `  template:\n`;
    k8s += `    metadata:\n`;
    k8s += `      labels:\n`;
    k8s += `        app: ${sName}\n`;
    k8s += `        tier: ${n.type}\n`;
    k8s += `    spec:\n`;
    k8s += `      containers:\n`;
    k8s += `        - name: ${sName}\n`;
    k8s += `          image: ${image}\n`;
    k8s += `          ports:\n`;
    k8s += `            - containerPort: ${port}\n`;
    k8s += `          resources:\n`;
    k8s += `            requests:\n`;
    k8s += `              cpu: "${upstreamCount > 1 ? '500m' : '250m'}"\n`;
    k8s += `              memory: "${n.type === 'database' ? '1Gi' : '512Mi'}"\n`;
    k8s += `            limits:\n`;
    k8s += `              cpu: "1000m"\n`;
    k8s += `              memory: "${n.type === 'database' ? '2Gi' : '1Gi'}"\n`;
    k8s += `---\n`;
    k8s += `apiVersion: v1\n`;
    k8s += `kind: Service\n`;
    k8s += `metadata:\n`;
    k8s += `  name: ${sName}\n`;
    k8s += `  namespace: ${safeNamespace}\n`;
    k8s += `spec:\n`;
    k8s += `  selector:\n`;
    k8s += `    app: ${sName}\n`;
    k8s += `  ports:\n`;
    k8s += `    - protocol: TCP\n`;
    k8s += `      port: ${port}\n`;
    k8s += `      targetPort: ${port}\n`;

    if (n.type === 'service' || n.type === 'gateway' || n.type === 'serverless') {
      k8s += `---\n`;
      k8s += `apiVersion: autoscaling/v2\n`;
      k8s += `kind: HorizontalPodAutoscaler\n`;
      k8s += `metadata:\n`;
      k8s += `  name: ${sName}-hpa\n`;
      k8s += `  namespace: ${safeNamespace}\n`;
      k8s += `spec:\n`;
      k8s += `  scaleTargetRef:\n`;
      k8s += `    apiVersion: apps/v1\n`;
      k8s += `    kind: Deployment\n`;
      k8s += `    name: ${sName}\n`;
      k8s += `  minReplicas: ${minReplicas}\n`;
      k8s += `  maxReplicas: ${maxReplicas}\n`;
      k8s += `  metrics:\n`;
      k8s += `    - type: Resource\n`;
      k8s += `      resource:\n`;
      k8s += `        name: cpu\n`;
      k8s += `        target:\n`;
      k8s += `          type: Utilization\n`;
      k8s += `          averageUtilization: 70\n`;
    }
  });

  return k8s;
}

export function exportKubernetesFile(nodes: GraphNode[], edges: GraphEdge[], name = 'graphflow') {
  const sanitizedName = sanitizeLabel(name) || 'graphflow';
  const content = generateKubernetesManifests(nodes, edges, sanitizedName);
  downloadFile('k8s-manifests.yaml', content, 'application/x-yaml');
}

export function generateArchitectureSvg(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: { title?: string; includeWatermark?: boolean } = {}
): string {
  const { title = 'Distributed System Topology', includeWatermark = true } = options;
  const diagnostics = analyzeTopologyDiagnostics(nodes, edges);

  const minX = nodes.length > 0 ? Math.min(...nodes.map(n => n.x)) : 0;
  const minY = nodes.length > 0 ? Math.min(...nodes.map(n => n.y)) : 0;
  const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x + (n.width || 190))) : 800;
  const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y + (n.height || 90))) : 450;

  const padX = 72;
  const headerH = 64;
  const footerH = includeWatermark ? 48 : 28;
  const padY = 56;

  const contentW = Math.max(820, maxX - minX + padX * 2);
  const contentH = Math.max(420, maxY - minY + padY * 2);
  const totalW = contentW;
  const totalH = headerH + contentH + footerH;

  const offsetX = padX - minX;
  const offsetY = headerH + padY - minY;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" fill="none">\n`;
  svg += `  <defs>\n`;
  svg += `    <pattern id="gf-export-grid" width="24" height="24" patternUnits="userSpaceOnUse">\n`;
  svg += `      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#181b20" stroke-width="1" />\n`;
  svg += `    </pattern>\n`;
  svg += `    <marker id="gf-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n`;
  svg += `      <path d="M 0 1 L 8 5 L 0 9 z" fill="#22d3ee" />\n`;
  svg += `    </marker>\n`;
  svg += `  </defs>\n\n`;

  svg += `  <rect width="${totalW}" height="${totalH}" fill="#08090a" />\n`;
  svg += `  <rect x="0" y="${headerH}" width="${totalW}" height="${contentH}" fill="url(#gf-export-grid)" />\n`;

  svg += `  <rect x="0" y="0" width="${totalW}" height="${headerH}" fill="#0c0e12" />\n`;
  svg += `  <line x1="0" y1="${headerH}" x2="${totalW}" y2="${headerH}" stroke="#1e293b" stroke-width="1" />\n`;
  svg += `  <rect x="24" y="20" width="24" height="24" rx="6" fill="#06b6d4" />\n`;
  svg += `  <text x="58" y="31" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700">${escapeXml(title)}</text>\n`;
  svg += `  <text x="58" y="47" fill="#64748b" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11">${nodes.length} Nodes • ${edges.length} Connections • Critical Path: ${diagnostics.criticalPathLatencyMs}ms</text>\n`;

  const hudText = `SLA: ${diagnostics.compositeSlaPercent}%   |   p99: ${diagnostics.p99LatencyMs}ms   |   Est. Cloud: ~$${diagnostics.estimatedMonthlyCostUsd}/mo`;
  svg += `  <text x="${totalW - 24}" y="37" text-anchor="end" fill="#22d3ee" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="600">${escapeXml(hudText)}</text>\n\n`;

  edges.forEach(e => {
    const from = nodeMap.get(e.fromNodeId);
    const to = nodeMap.get(e.toNodeId);
    if (!from || !to) return;

    const x1 = from.x + (from.width || 190) + offsetX;
    const y1 = from.y + (from.height || 90) / 2 + offsetY;
    const x2 = to.x + offsetX;
    const y2 = to.y + (to.height || 90) / 2 + offsetY;

    const dx = Math.max(60, Math.abs(x2 - x1) * 0.45);
    const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    const strokeColor = e.errorRate > 2 ? '#f43f5e' : '#334155';

    svg += `  <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2" marker-end="url(#gf-arrow)" />\n`;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 8;
    const badgeLabel = `${e.protocol} (${e.latencyMs}ms)`;
    const badgeW = Math.max(76, badgeLabel.length * 6.2 + 14);

    svg += `  <rect x="${midX - badgeW / 2}" y="${midY - 10}" width="${badgeW}" height="18" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="1" />\n`;
    svg += `  <text x="${midX}" y="${midY + 2}" text-anchor="middle" fill="#94a3b8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9.5">${escapeXml(badgeLabel)}</text>\n`;
  });

  nodes.forEach(n => {
    const nx = n.x + offsetX;
    const ny = n.y + offsetY;
    const nw = n.width || 190;
    const nh = n.height || 90;
    const statusColor = n.status === 'down' ? '#ef4444' : n.status === 'degraded' ? '#f59e0b' : '#10b981';

    svg += `  <g transform="translate(${nx}, ${ny})">\n`;
    svg += `    <rect width="${nw}" height="${nh}" rx="10" fill="#0f1319" stroke="#1e293b" stroke-width="1.5" />\n`;
    svg += `    <rect x="1" y="1" width="${nw - 2}" height="4" rx="2" fill="${escapeXml(n.color || '#22d3ee')}" />\n`;
    svg += `    <circle cx="${nw - 14}" cy="18" r="4" fill="${statusColor}" />\n`;
    svg += `    <text x="14" y="26" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="700">${escapeXml(n.title.slice(0, 22))}</text>\n`;
    svg += `    <text x="14" y="43" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="10.5">${escapeXml(n.subtitle.slice(0, 26))}</text>\n`;
    svg += `    <line x1="12" y1="58" x2="${nw - 12}" y2="58" stroke="#1e293b" stroke-width="1" />\n`;
    svg += `    <text x="14" y="75" fill="#94a3b8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10">${n.latencyMs}ms • ${n.errorRate}% err</text>\n`;
    svg += `    <text x="${nw - 14}" y="75" text-anchor="end" fill="#22d3ee" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" font-weight="600">${n.throughputRps} RPS</text>\n`;
    svg += `  </g>\n`;
  });

  if (includeWatermark) {
    const wmY = totalH - 34;
    svg += `  <g transform="translate(${totalW - 335}, ${wmY})">\n`;
    svg += `    <rect width="315" height="24" rx="6" fill="#0c1218" stroke="#155e75" stroke-width="1" />\n`;
    svg += `    <text x="157" y="15.5" text-anchor="middle" fill="#22d3ee" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" font-weight="600">Simulated with GraphFlow.dev • System Design</text>\n`;
    svg += `  </g>\n`;
  }

  svg += `</svg>`;
  return svg;
}

export function exportSvgDiagram(nodes: GraphNode[], edges: GraphEdge[], includeWatermark = true, name = 'graphflow-topology') {
  const safeName = sanitizeLabel(name).toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'graphflow-topology';
  const svg = generateArchitectureSvg(nodes, edges, { includeWatermark });
  downloadFile(`${safeName}.svg`, svg, 'image/svg+xml;charset=utf-8');
}

export function exportPngDiagram(nodes: GraphNode[], edges: GraphEdge[], includeWatermark = true, name = 'graphflow-topology') {
  const safeName = sanitizeLabel(name).toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'graphflow-topology';
  const svg = generateArchitectureSvg(nodes, edges, { includeWatermark });
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `${safeName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
        }
      }, 'image/png');
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
