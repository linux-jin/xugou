import { Bindings } from "../models/db";
import * as AgentRepository from "../repositories";
import { generateToken, verifyToken } from "../utils/jwt";
import { handleAgentThresholdNotification } from "../jobs/agent-task";

/**
 * 获取所有客户端
 * @param db 数据库连接
 * @returns 客户端列表
 */
export async function getAgents(
  db: Bindings["DB"],
) {
  try {
    const result = await AgentRepository.getAllAgents(db);
    return {
      success: true,
      agents: result.results || [],
      status: 200,
    };
  } catch (error) {
    console.error("获取客户端列表错误:", error);
    return {
      success: false,
      message: "获取客户端列表失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 根据ID获取客户端详情
 * @param db 数据库连接
 * @param agentId 客户端ID
 * @returns 客户端详情
 */
export async function getAgentDetail(db: Bindings["DB"], agentId: number) {
  // 获取客户端信息
  const agent = await AgentRepository.getAgentById(db, agentId);

  if (!agent) {
    return { success: false, message: "客户端不存在", status: 404 };
  }

  // 不返回令牌，但保留其他所有字段
  const { token, ...rest } = agent;

  return {
    success: true,
    agent: {
      ...rest,
      ip_addresses: getFormattedIPAddresses(rest.ip_addresses as any),
    },
    status: 200,
  };
}

/**
 * 创建新客户端
 * @param db 数据库连接
 * @param env 环境变量
 * @param name 客户端名称
 * @param userId 创建者ID
 * @returns 创建结果
 */
export async function createAgentService(
  db: Bindings["DB"],
  env: any,
  name: string,
  userId: number
) {
  try {
    // 验证名称
    if (!name || name.trim() === "") {
      return { success: false, message: "客户端名称不能为空", status: 400 };
    }

    // 生成令牌
    const token = await generateAgentToken(env);

    // 创建新客户端
    const newAgent = await AgentRepository.createAgent(db, name, token, userId);

    return {
      success: true,
      message: "客户端创建成功",
      agent: newAgent,
      status: 201,
    };
  } catch (error) {
    console.error("创建客户端错误:", error);
    return {
      success: false,
      message: "创建客户端失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 更新客户端信息
 * @param db 数据库连接
 * @param agentId 客户端ID
 * @param updateData 更新数据
 * @returns 更新结果
 */
export async function updateAgentService(
  db: Bindings["DB"],
  agentId: number,
  updateData: {
    name?: string;
    hostname?: string;
    ip_addresses?: string[];
    os?: string;
    version?: string;
    status?: string;
  },
) {
  try {
    // 获取当前客户端数据
    const agent = await AgentRepository.getAgentById(db, agentId);

    if (!agent) {
      return { success: false, message: "客户端不存在", status: 404 };
    }

    // 验证数据
    if (updateData.name && updateData.name.trim() === "") {
      return { success: false, message: "客户端名称不能为空", status: 400 };
    }

    // 执行更新
    const result = await AgentRepository.updateAgent(db, agentId, updateData);

    if (
      typeof result === "object" &&
      "message" in result &&
      result.message === "没有更新任何字段"
    ) {
      return {
        success: true,
        message: "没有更新任何字段",
        agent,
        status: 200,
      };
    }

    return {
      success: true,
      message: "客户端信息已更新",
      agent: result,
      status: 200,
    };
  } catch (error) {
    console.error("更新客户端错误:", error);
    return {
      success: false,
      message: "更新客户端失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 删除客户端
 * @param db 数据库连接
 * @param agentId 客户端ID
 * @returns 删除结果
 */
export async function deleteAgentService(
  db: Bindings["DB"],
  agentId: number,
) {
  try {
    // 获取客户端信息
    const agent = await AgentRepository.getAgentById(db, agentId);

    if (!agent) {
      return { success: false, message: "客户端不存在", status: 404 };
    }

    // 执行删除客户端
    await AgentRepository.deleteAgent(db, agent.id);

    return {
      success: true,
      message: "客户端已删除",
      status: 200,
    };
  } catch (error) {
    console.error("删除客户端错误:", error);
    return {
      success: false,
      message: "删除客户端失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 生成客户端注册令牌
 * @param env 环境变量
 * @returns 生成结果
 */
export async function generateAgentToken(env: any) {
  try {
    return await generateToken(env);
  } catch (error) {
    console.error("生成令牌错误:", error);
    throw new Error("生成令牌失败");
  }
}

/**
 * 验证客户端注册令牌
 * @param token 令牌
 * @param env 环境变量
 * @returns 验证结果
 */
export async function verifyAgentToken(token: string, env: any) {
  try {
    return await verifyToken(token, env);
  } catch (error) {
    console.error("验证令牌错误:", error);
    return { valid: false, message: "令牌验证失败" };
  }
}

/**
 * 获取格式化后的IP地址
 * @param ipAddressesJson IP地址的JSON字符串
 * @returns 格式化后的IP地址
 */
export function getFormattedIPAddresses(
  ipAddressesJson: string | null
): string {
  try {
    if (!ipAddressesJson) return "未知";
    const ipArray = JSON.parse(String(ipAddressesJson));
    return Array.isArray(ipArray) && ipArray.length > 0
      ? ipArray.join(", ")
      : "未知";
  } catch (e) {
    return String(ipAddressesJson || "未知");
  }
}

/**
 * 客户端自注册
 * @param db 数据库连接
 * @param env 环境变量
 * @param token 注册令牌
 * @param name 客户端名称
 * @param hostname 主机名
 * @param ipAddresses IP地址
 * @param os 操作系统
 * @param version 版本
 * @returns 注册结果
 */
export async function registerAgentService(
  db: Bindings["DB"],
  env: any,
  token: string,
  name: string,
  hostname: string | null = null,
  ipAddresses: string[] | null = null,
  os: string | null = null,
  version: string | null = null
) {
  try {
    // 验证令牌
    if (!token) {
      return { success: false, message: "缺少注册令牌", status: 400 };
    }

    // 通过token查找客户端
    const existingAgent = await AgentRepository.getAgentByToken(db, token);

    if (existingAgent) {
      return {
        success: true,
        message: "客户端已存在",
        status: 200,
        agent: {
          id: existingAgent.id,
        },
      };
    }

    // 验证令牌
    const tokenVerification = await verifyAgentToken(token, env);

    // 如果令牌无效，返回错误
    if (!tokenVerification.valid) {
      return {
        success: false,
        message: `注册令牌无效: ${tokenVerification.message}`,
        status: 400,
      };
    }

    // 查找管理员用户作为客户端创建者
    const adminId = await AgentRepository.getAdminUserId(db);

    // 创建新客户端
    const newAgent = await AgentRepository.createAgent(
      db,
      name || "New Agent",
      token,
      adminId,
      "active",
      hostname || null,
      os || null,
      version || null,
      ipAddresses
    );

    return {
      success: true,
      message: "客户端注册成功",
      agent: { id: newAgent.id },
      status: 201,
    };
  } catch (error) {
    console.error("客户端注册错误:", error);
    return {
      success: false,
      message: "客户端注册失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 更新客户端状态
 * @param db 数据库连接
 * @param env 环境变量
 * @param status 客户端指标
 * @returns 更新结果
 */
export async function updateAgentStatusService(
  db: Bindings["DB"],
  env: any,
  status: any
) {
  try {
    const statusData = Array.isArray(status) ? status : [status];
    const norlmalInfo = {
      token: statusData[0]?.token,
      ip_addresses: statusData[0]?.ip_addresses,
      hostname: statusData[0]?.hostname,
      os: statusData[0]?.os,
      version: statusData[0]?.version,
      keepalive: statusData[0]?.keepalive,
      status: "active",
    };

    console.log("norlmalInfo", norlmalInfo);

    if (!norlmalInfo.token) {
      return { success: false, message: "缺少API令牌", status: 400 };
    }
    // 通过token查找客户端
    const agent = await AgentRepository.getAgentByToken(db, norlmalInfo.token);

    console.log("agent", agent);

    if (
      agent.status != "active" ||
      agent.hostname != norlmalInfo.hostname ||
      agent.ip_addresses != norlmalInfo.ip_addresses ||
      agent.os != norlmalInfo.os ||
      agent.version != norlmalInfo.version
    ) {
      console.log("更新客户端信息");
      await AgentRepository.updateAgent(db, agent.id, norlmalInfo);
    }

    // 插入 metric 信息

    const metrics = statusData.map((item) => ({
      agent_id: agent.id,
      timestamp: new Date().toISOString(),
      cpu_usage: item?.cpu?.usage,
      cpu_cores: item?.cpu?.cores,
      cpu_model: item?.cpu?.model_name,
      memory_total: item?.memory?.total,
      memory_used: item?.memory?.used,
      memory_free: item?.memory?.free,
      memory_usage_rate: item?.memory?.usage_rate,
      load_1: item?.load?.load1,
      load_5: item?.load?.load5,
      load_15: item?.load?.load15,
      disk_metrics: JSON.stringify(item?.disks || []),
      network_metrics: JSON.stringify(item?.network || []),
    }));

    console.log("metrics", metrics);

    // 插入 metric 信息到 24h 热表
    for (const metric of metrics) {
      console.log("准备插入指标数据:", metric);
      const metricValues = [
        metric.agent_id,
        metric.timestamp,
        metric.cpu_usage,
        metric.cpu_cores,
        metric.cpu_model,
        metric.memory_total,
        metric.memory_used,
        metric.memory_free,
        metric.memory_usage_rate,
        metric.load_1,
        metric.load_5,
        metric.load_15,
        metric.disk_metrics,
        metric.network_metrics,
      ];
      console.log("指标数据值:", metricValues);
      const result = await AgentRepository.insertAgentMetrics(db, metricValues);
      console.log("插入指标结果:", result);
    }

    // 取出 metrics中的最新一条数据用于通知
    const latestMetric = metrics[metrics.length - 1];
    console.log("latestMetric cpu", latestMetric.cpu_usage);
    console.log("latestMetric memory", latestMetric.memory_usage_rate);
    await handleAgentThresholdNotification(
      env,
      agent.id,
      "cpu",
      latestMetric.cpu_usage
    );

    await handleAgentThresholdNotification(
      env,
      agent.id,
      "memory",
      latestMetric.memory_usage_rate
    );

    return {
      success: true,
      message: "客户端状态已更新",
      agentId: agent.id,
      status: 200,
    };
  } catch (error) {
    console.error("更新客户端状态错误:", error);
    return {
      success: false,
      message: "更新客户端状态失败",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getAgentById(db: Bindings["DB"], id: number) {
  return await AgentRepository.getAgentById(db, id);
}

export async function getActiveAgents(env: any) {
  return await AgentRepository.getActiveAgents(env.DB);
}

export async function setAgentInactive(env: any, id: number) {
  return await AgentRepository.setAgentInactive(env.DB, id);
}


export async function getAgentMetrics(db: Bindings["DB"], agentId: number) {
  return await AgentRepository.getAgentMetrics(db, agentId);
}