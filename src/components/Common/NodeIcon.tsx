import React from 'react';
import {
  Globe,
  Smartphone,
  Network,
  Server,
  Zap,
  Cpu,
  Database,
  HardDrive,
  Shuffle,
  ExternalLink,
  ShieldCheck,
  Layers,
  LucideProps
} from 'lucide-react';

interface NodeIconProps extends LucideProps {
  name: string;
}

export const NodeIcon: React.FC<NodeIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Globe': return <Globe {...props} />;
    case 'Smartphone': return <Smartphone {...props} />;
    case 'Network': return <Network {...props} />;
    case 'Server': return <Server {...props} />;
    case 'Zap': return <Zap {...props} />;
    case 'Cpu': return <Cpu {...props} />;
    case 'Database': return <Database {...props} />;
    case 'HardDrive': return <HardDrive {...props} />;
    case 'Shuffle': return <Shuffle {...props} />;
    case 'ExternalLink': return <ExternalLink {...props} />;
    case 'ShieldCheck': return <ShieldCheck {...props} />;
    default: return <Layers {...props} />;
  }
};
