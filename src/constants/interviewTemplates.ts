import { ArchitectureTemplate, GraphEdge, GraphNode, NodeType, ProtocolType } from '../types/graph';

// Classic system design interview questions as runnable presets. Each description ends with
// the experiment to try, so a candidate sees the bottleneck instead of only drawing it.

const STYLE: Record<NodeType, { color: string; iconName: string }> = {
  client: { color: '#38bdf8', iconName: 'Globe' },
  gateway: { color: '#818cf8', iconName: 'Network' },
  service: { color: '#a855f7', iconName: 'Server' },
  database: { color: '#3b82f6', iconName: 'Database' },
  cache: { color: '#f43f5e', iconName: 'Cpu' },
  queue: { color: '#f59e0b', iconName: 'Shuffle' },
  serverless: { color: '#ec4899', iconName: 'Zap' },
  storage: { color: '#14b8a6', iconName: 'HardDrive' },
  external: { color: '#10b981', iconName: 'ExternalLink' },
};

const node = (
  id: string, type: NodeType, title: string, subtitle: string,
  // throughputRps is the node's capacity: health checks use ~240 RPS inbound (~600 in surge mode),
  // so the intended bottleneck sits between those and everything else above 600.
  col: number, row: number, latencyMs: number, errorRate: number, throughputRps: number,
): GraphNode => ({
  id, type, title, subtitle,
  x: 80 + col * 280, y: 80 + row * 140, width: 190, height: 90,
  status: 'healthy', latencyMs, errorRate, throughputRps, ...STYLE[type],
});

const edges = (list: [string, string, ProtocolType, number, string][]): GraphEdge[] =>
  list.map(([fromNodeId, toNodeId, protocol, latencyMs, label], i) => ({
    id: `e${i + 1}`, fromNodeId, toNodeId, protocol, latencyMs, errorRate: 0, label,
  }));

export const INTERVIEW_TAG = 'Interview';

export const INTERVIEW_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: 'interview-url-shortener',
    name: 'Design a URL Shortener',
    description: 'Read-heavy redirects served from a Redis cache in front of a key-value store, with a key generation service and async click analytics. Try: inject a traffic surge and find which node saturates first, then decide whether a bigger cache or read replicas fix it.',
    difficulty: 'Beginner',
    tags: [INTERVIEW_TAG, 'Caching', 'Read-heavy', 'Redis'],
    nodes: [
      node('us-client', 'client', 'Browser', 'GET /aZ3kQ', 0, 1, 20, 0, 900),
      node('us-lb', 'gateway', 'Load Balancer', 'L7 / TLS', 1, 1, 4, 0, 1000),
      node('us-write', 'service', 'Shorten API', 'POST /urls', 2, 0, 30, 0.1, 800),
      node('us-read', 'service', 'Redirect Service', '301 lookup', 2, 2, 12, 0.1, 940),
      node('us-kgs', 'service', 'Key Generator', 'Pre-allocated ranges', 3, 0, 5, 0, 1000),
      node('us-cache', 'cache', 'Hot URL Cache', 'Redis', 3, 2, 2, 0, 900),
      node('us-db', 'database', 'URL Store', 'Cassandra / DynamoDB', 4, 1, 25, 0.1, 400),
      node('us-kafka', 'queue', 'Click Events', 'Kafka', 3, 3, 8, 0, 940),
      node('us-analytics', 'service', 'Click Aggregator', 'Stream consumer', 4, 3, 40, 0.2, 900),
    ],
    edges: edges([
      ['us-client', 'us-lb', 'HTTP/REST', 20, 'HTTPS'],
      ['us-lb', 'us-write', 'HTTP/REST', 3, 'create'],
      ['us-lb', 'us-read', 'HTTP/REST', 3, 'redirect'],
      ['us-write', 'us-kgs', 'gRPC', 4, 'nextKey'],
      ['us-write', 'us-db', 'TCP', 15, 'PUT key'],
      ['us-read', 'us-cache', 'TCP', 1, 'GET key'],
      ['us-cache', 'us-db', 'TCP', 15, 'miss'],
      ['us-read', 'us-kafka', 'Kafka', 5, 'clicked'],
      ['us-kafka', 'us-analytics', 'Kafka', 5, 'consume'],
    ]),
  },
  {
    id: 'interview-news-feed',
    name: 'Design a Twitter News Feed',
    description: 'Fan-out on write: a new post goes through Kafka to workers that push it into every follower timeline in Redis, so reading the feed is one cache hit. Try: inject a surge to play a celebrity posting and watch the fan-out workers fall behind.',
    difficulty: 'Intermediate',
    tags: [INTERVIEW_TAG, 'Fan-out', 'Kafka', 'Redis'],
    nodes: [
      node('nf-client', 'client', 'Mobile App', 'Post + scroll', 0, 1, 30, 0.2, 800),
      node('nf-gw', 'gateway', 'API Gateway', 'Auth + routing', 1, 1, 8, 0, 800),
      node('nf-post', 'service', 'Post Service', 'Write path', 2, 0, 35, 0.1, 800),
      node('nf-feed', 'service', 'Feed Service', 'Read path', 2, 2, 15, 0.1, 1500),
      node('nf-posts-db', 'database', 'Posts DB', 'Sharded by user', 3, 0, 30, 0.1, 800),
      node('nf-kafka', 'queue', 'Fan-out Topic', 'Kafka', 3, 1, 10, 0, 5000),
      node('nf-workers', 'service', 'Fan-out Workers', 'Push to followers', 4, 1, 120, 0.5, 400),
      node('nf-graph', 'database', 'Social Graph', 'Followers lookup', 5, 0, 20, 0.1, 1500),
      node('nf-timeline', 'cache', 'Timeline Cache', 'Redis lists', 4, 2, 2, 0, 3000),
    ],
    edges: edges([
      ['nf-client', 'nf-gw', 'HTTP/REST', 30, 'HTTPS'],
      ['nf-gw', 'nf-post', 'gRPC', 5, 'createPost'],
      ['nf-gw', 'nf-feed', 'gRPC', 5, 'getFeed'],
      ['nf-post', 'nf-posts-db', 'SQL Query', 20, 'INSERT post'],
      ['nf-post', 'nf-kafka', 'Kafka', 6, 'post.created'],
      ['nf-kafka', 'nf-workers', 'Kafka', 5, 'consume'],
      ['nf-workers', 'nf-graph', 'gRPC', 15, 'followers'],
      ['nf-workers', 'nf-timeline', 'TCP', 2, 'LPUSH x N'],
      ['nf-feed', 'nf-timeline', 'TCP', 2, 'LRANGE'],
    ]),
  },
  {
    id: 'interview-chat',
    name: 'Design WhatsApp (Chat)',
    description: 'Clients hold WebSocket connections to a gateway; messages are persisted through Kafka, presence lives in Redis, and offline users get a push notification. Try: raise the push provider latency and error rate, then check whether online delivery stays fast while offline notifications suffer.',
    difficulty: 'Intermediate',
    tags: [INTERVIEW_TAG, 'WebSocket', 'Presence', 'Kafka'],
    nodes: [
      node('ch-alice', 'client', 'Sender', 'Mobile', 0, 0, 40, 0.3, 300),
      node('ch-bob', 'client', 'Recipient', 'Mobile', 0, 2, 40, 0.3, 300),
      node('ch-ws', 'gateway', 'WebSocket Gateway', 'Sticky connections', 1, 1, 5, 0.05, 2000),
      node('ch-chat', 'service', 'Chat Service', 'Route + ack', 2, 1, 20, 0.1, 2000),
      node('ch-presence', 'cache', 'Presence', 'Redis TTL keys', 3, 0, 2, 0, 5000),
      node('ch-kafka', 'queue', 'Message Log', 'Kafka per chat', 3, 1, 8, 0, 5000),
      node('ch-store', 'database', 'Message Store', 'Cassandra', 4, 1, 20, 0.1, 2000),
      node('ch-push', 'service', 'Notifier', 'Offline users', 3, 2, 30, 0.2, 800),
      node('ch-apns', 'external', 'APNs / FCM', 'Push provider', 4, 2, 200, 1.5, 500),
    ],
    edges: edges([
      ['ch-alice', 'ch-ws', 'WebSocket', 40, 'send'],
      ['ch-ws', 'ch-chat', 'gRPC', 3, 'message'],
      ['ch-chat', 'ch-presence', 'TCP', 1, 'isOnline?'],
      ['ch-chat', 'ch-kafka', 'Kafka', 5, 'append'],
      ['ch-kafka', 'ch-store', 'Kafka', 10, 'persist'],
      ['ch-chat', 'ch-ws', 'gRPC', 3, 'deliver'],
      ['ch-ws', 'ch-bob', 'WebSocket', 40, 'push'],
      ['ch-chat', 'ch-push', 'gRPC', 5, 'offline'],
      ['ch-push', 'ch-apns', 'HTTP/REST', 180, 'notify'],
    ]),
  },
  {
    id: 'interview-rate-limiter',
    name: 'Design a Rate Limiter',
    description: 'A token-bucket limiter at the gateway keeps counters in Redis before any request reaches the backend. Try: raise Redis latency and watch every request, allowed or not, pay for the limiter check; then take Redis down and decide whether to fail open or closed.',
    difficulty: 'Beginner',
    tags: [INTERVIEW_TAG, 'Rate limiting', 'Redis'],
    nodes: [
      node('rl-clients', 'client', 'API Clients', 'Per-key traffic', 0, 1, 25, 0, 1500),
      node('rl-gw', 'gateway', 'Edge Gateway', 'Limiter middleware', 1, 1, 3, 0, 1500),
      node('rl-limiter', 'service', 'Rate Limiter', 'Token bucket', 2, 0, 4, 0.05, 1500),
      node('rl-redis', 'cache', 'Counters', 'Redis INCR + TTL', 3, 0, 1, 0, 1500),
      node('rl-api', 'service', 'Backend API', 'Business logic', 2, 2, 60, 0.3, 1000),
      node('rl-db', 'database', 'Primary DB', 'PostgreSQL', 3, 2, 30, 0.1, 1000),
    ],
    edges: edges([
      ['rl-clients', 'rl-gw', 'HTTP/REST', 25, 'requests'],
      ['rl-gw', 'rl-limiter', 'gRPC', 1, 'allow?'],
      ['rl-limiter', 'rl-redis', 'TCP', 1, 'INCR key'],
      ['rl-gw', 'rl-api', 'HTTP/REST', 3, 'allowed'],
      ['rl-api', 'rl-db', 'SQL Query', 20, 'query'],
    ]),
  },
  {
    id: 'interview-ride-sharing',
    name: 'Design Uber (Ride Sharing)',
    description: 'Drivers stream locations into a geo index; matching queries nearby drivers, trips are stored transactionally and trip events feed surge pricing. Try: inject a traffic surge and see what falls over first, location ingest or matching, and how you would split them.',
    difficulty: 'Advanced',
    tags: [INTERVIEW_TAG, 'Geo index', 'WebSocket', 'Kafka'],
    nodes: [
      node('ub-rider', 'client', 'Rider App', 'Request ride', 0, 0, 40, 0.3, 200),
      node('ub-driver', 'client', 'Driver App', 'Location every 4s', 0, 2, 40, 0.3, 2500),
      node('ub-gw', 'gateway', 'API Gateway', 'REST + WebSocket', 1, 1, 6, 0.05, 2700),
      node('ub-location', 'service', 'Location Service', 'Ingest pings', 2, 2, 10, 0.1, 2500),
      node('ub-geo', 'cache', 'Geo Index', 'Redis GEO / geohash', 3, 1, 3, 0, 2700),
      node('ub-match', 'service', 'Matching Service', 'Nearest drivers', 2, 0, 50, 0.3, 400),
      node('ub-trip', 'service', 'Trip Service', 'State machine', 3, 0, 30, 0.2, 800),
      node('ub-trips-db', 'database', 'Trips DB', 'PostgreSQL', 4, 0, 30, 0.1, 800),
      node('ub-kafka', 'queue', 'Trip Events', 'Kafka', 4, 1, 8, 0, 5000),
      node('ub-pricing', 'service', 'Surge Pricing', 'Demand / supply', 5, 1, 80, 0.3, 800),
      node('ub-maps', 'external', 'Maps API', 'ETA + routing', 4, 2, 150, 1, 1000),
    ],
    edges: edges([
      ['ub-rider', 'ub-gw', 'HTTP/REST', 40, 'requestRide'],
      ['ub-driver', 'ub-gw', 'WebSocket', 40, 'location'],
      ['ub-gw', 'ub-location', 'gRPC', 3, 'ping'],
      ['ub-location', 'ub-geo', 'TCP', 2, 'GEOADD'],
      ['ub-gw', 'ub-match', 'gRPC', 3, 'match'],
      ['ub-match', 'ub-geo', 'TCP', 2, 'GEOSEARCH'],
      ['ub-match', 'ub-trip', 'gRPC', 5, 'createTrip'],
      ['ub-trip', 'ub-trips-db', 'SQL Query', 20, 'INSERT trip'],
      ['ub-trip', 'ub-kafka', 'Kafka', 5, 'trip.events'],
      ['ub-kafka', 'ub-pricing', 'Kafka', 5, 'consume'],
      ['ub-match', 'ub-maps', 'HTTP/REST', 140, 'ETA'],
    ]),
  },
];
