// 客户端类型定义
export interface Agent {
  id: number;
  name: string;
  token: string;
  created_by: number;
  status: string;
  created_at: string;
  updated_at: string;
  hostname: string | null;
  keepalive: string | null;
  ip_addresses: string | null; // 存储多个IP地址的JSON字符串
  os: string | null;
  version: string | null;
  metrics: Metrics[] | null;
}

export interface Metrics {
  id: number;
  agent_id: number;
  timestamp: string;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  networks: NetworkInfo[];
  load: LoadInfo;
}

export interface CPUInfo {
  usage: number;
  cores: number;
  model_name: string;
}

export interface MemoryInfo{
  total: number;
  used: number;
  free: number;
  usage_rate: number;
}

export interface DiskInfo{
  device: string;
  mount_point: string;
  total: number;
  used: number;
  free: number;
  usage_rate: number;
  fs_type: string;
}

export interface NetworkInfo{
  interface: string;
  bytes_sent: number;
  bytes_recv: number;
  packets_sent: number;
  packets_recv: number;
}

export interface LoadInfo{
  load1: number;
  load5: number;
  load15: number;
}