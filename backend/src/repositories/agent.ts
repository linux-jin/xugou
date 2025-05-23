import { Bindings } from "../models/db";
import { Agent, Metrics } from "../models/agent";

/**
 * 客户端相关的数据库操作
 */

// 获取所有客户端
export async function getAllAgents(db: Bindings["DB"]) {
  return await db
    .prepare("SELECT * FROM agents ORDER BY created_at DESC")
    .all<Agent>();
}

// 批量获取客户端详情
export async function getAgentsByIds(db: Bindings["DB"], agentIds: number[]) {
  if (agentIds.length === 0) {
    return { results: [] };
  }

  const placeholders = agentIds.map(() => "?").join(",");
  return await db
    .prepare(`SELECT * FROM agents WHERE id IN (${placeholders})`)
    .bind(...agentIds)
    .all<Agent>();
}

// 批量获取客户端指标
export async function getAgentMetricsByIds(
  db: Bindings["DB"],
  agentIds: number[]
) {
  if (agentIds.length === 0) {
    return { results: [] };
  }
  const placeholders = agentIds.map(() => "?").join(",");
  return await db
    .prepare(
      `SELECT * FROM agent_metrics_24h WHERE agent_id IN (${placeholders})`
    )
    .bind(...agentIds)
    .all<Metrics>();
}

// 获取单个客户端详情
export async function getAgentById(db: Bindings["DB"], id: number) {
  return await db
    .prepare("SELECT * FROM agents WHERE id = ?")
    .bind(id)
    .first<Agent>();
}

// 创建新客户端
export async function createAgent(
  db: Bindings["DB"],
  name: string,
  token: string,
  createdBy: number,
  status: string = "inactive",
  hostname: string | null = null,
  os: string | null = null,
  version: string | null = null,
  ipAddresses: string[] | null = null,
  keepalive: string | null = null
) {
  const now = new Date().toISOString();

  // 将 ipAddresses 数组转换为 JSON 字符串
  const ipAddressesJson = ipAddresses ? JSON.stringify(ipAddresses) : null;

  const result = await db
    .prepare(
      `INSERT INTO agents 
     (name, token, created_by, status, created_at, updated_at, hostname, ip_addresses, os, version, keepalive) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`
    )
    .bind(
      name,
      token,
      createdBy,
      status,
      now,
      now,
      hostname,
      ipAddressesJson,
      os,
      version,
      keepalive
    )
    .run();

  if (!result.success) {
    throw new Error("创建客户端失败");
  }

  // 获取新创建的客户端
  return await db
    .prepare("SELECT * FROM agents WHERE rowid = last_insert_rowid()")
    .first<Agent>();
}

// 更新客户端信息
export async function updateAgent(
  db: Bindings["DB"],
  id: number,
  fields: {
    name?: string;
    hostname?: string;
    ip_addresses?: string[];
    os?: string;
    version?: string;
    status?: string;
    keepalive?: string;
  }
) {
  const fieldsToUpdate = [];
  const values = [];

  // 添加需要更新的字段
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      // 特殊处理 ip_addresses 数组，转换为 JSON 字符串
      if (key === "ip_addresses" && Array.isArray(value)) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(value);
      }
    }
  }

  // 添加更新时间
  fieldsToUpdate.push("updated_at = ?");
  values.push(new Date().toISOString());

  // 添加ID作为条件
  values.push(id);

  // 如果没有要更新的字段，直接返回
  if (fieldsToUpdate.length === 1) {
    // 只有updated_at
    return { success: true, message: "没有更新任何字段" };
  }

  // 执行更新
  const updateSql = `
    UPDATE agents 
    SET ${fieldsToUpdate.join(", ")} 
    WHERE id = ?
  `;

  const result = await db
    .prepare(updateSql)
    .bind(...values)
    .run();

  if (!result.success) {
    throw new Error("更新客户端失败");
  }

  // 获取更新后的客户端
  return result.success;
}

// 删除客户端
export async function deleteAgent(db: Bindings["DB"], id: number) {
  // 先删除关联的指标数据
  await db
    .prepare("DELETE FROM agent_metrics_24h WHERE agent_id = ?")
    .bind(id)
    .run();

  const result = await db
    .prepare("DELETE FROM agents WHERE id = ?")
    .bind(id)
    .run();

  if (!result.success) {
    throw new Error("删除客户端失败");
  }

  return { success: true, message: "客户端已删除" };
}

// 通过令牌获取客户端
export async function getAgentByToken(db: Bindings["DB"], token: string) {
  return await db
    .prepare("SELECT * FROM agents WHERE token = ?")
    .bind(token)
    .first<Agent>();
}

// 获取活跃状态的客户端
export async function getActiveAgents(db: Bindings["DB"]) {
  return await db
    .prepare('SELECT id, name, updated_at, keepalive FROM agents WHERE status = "active"')
    .all();
}

// 设置客户端为离线状态
export async function setAgentInactive(db: Bindings["DB"], id: number) {
  const now = new Date().toISOString();

  return await db
    .prepare(
      'UPDATE agents SET status = "inactive", updated_at = ? WHERE id = ?'
    )
    .bind(now, id)
    .run();
}

// 插入客户端资源指标
export async function insertAgentMetrics(db: Bindings["DB"], metrics: any) {
  return await db
    .prepare(
      "INSERT INTO agent_metrics_24h (agent_id, timestamp, cpu_usage, cpu_cores, cpu_model, memory_total, memory_used, memory_free, memory_usage_rate, load_1, load_5, load_15, disk_metrics, network_metrics) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(...metrics)
    .run();
}

// 获取指定客户端资源指标
export async function getAgentMetrics(db: Bindings["DB"], agentId: number) {
  return await db
    .prepare("SELECT * FROM agent_metrics_24h WHERE agent_id =?")
    .bind(agentId)
    .all();
}
