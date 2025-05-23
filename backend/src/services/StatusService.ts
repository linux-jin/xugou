/**
 * StatusService.ts
 * 状态页服务，处理状态页配置、监控项和客户端相关的业务逻辑
 */
import * as repositories from "../repositories";
import { Bindings, Agent } from "../models";

/**
 * 获取状态页配置(管理员)
 * @param env 环境变量，包含数据库连接
 * @param userId 用户ID
 * @returns 状态页配置信息
 */
export async function getStatusPageConfig(
  env: { DB: Bindings["DB"] },
  userId: number
) {
  try {
    // 检查是否已存在配置
    const existingConfig = await repositories.getStatusPageConfigById(
      env.DB,
      userId
    );

    let configId: number;

    if (existingConfig && existingConfig.id) {
      configId = existingConfig.id;
    } else {
      // 创建默认配置
      const insertResult = await repositories.createStatusPageConfig(
        env.DB,
        userId,
        "系统状态",
        "实时监控系统状态",
        "",
        ""
      );

      if (!insertResult || typeof insertResult.id !== "number") {
        throw new Error("创建状态页配置失败");
      }

      configId = insertResult.id;
    }

    // 获取该用户的所有监控项
    const monitorsResult = await repositories.getConfigMonitors(
      env.DB,
      configId,
      userId
    );

    // 获取该用户的所有客户端
    const agentsResult = await repositories.getConfigAgents(
      env.DB,
      configId,
      userId
    );

    // 构建配置对象返回
    const config = await env.DB.prepare(
      "SELECT * FROM status_page_config WHERE id = ?"
    )
      .bind(configId)
      .first<{
        title?: string;
        description?: string;
        logo_url?: string;
        custom_css?: string;
      }>();

    return {
      title: config?.title || "",
      description: config?.description || "",
      logoUrl: config?.logo_url || "",
      customCss: config?.custom_css || "",
      monitors:
        monitorsResult.results?.map((m) => ({
          id: m.id,
          name: m.name,
          selected: m.selected === 1,
        })) || [],
      agents:
        agentsResult.results?.map((a) => ({
          id: a.id,
          name: a.name,
          selected: a.selected === 1,
        })) || [],
    };
  } catch (error) {
    console.error("获取状态页配置失败:", error);
    throw new Error("获取状态页配置失败");
  }
}

/**
 * 保存状态页配置
 * @param env 环境变量，包含数据库连接
 * @param userId 用户ID
 * @param data 要保存的配置数据
 * @returns 保存结果
 */
export async function saveStatusPageConfig(
  env: { DB: Bindings["DB"] },
  userId: number,
  data: {
    title: string;
    description: string;
    logoUrl: string;
    customCss: string;
    monitors: number[];
    agents: number[];
  }
) {
  try {
    // 检查是否已存在配置
    const existingConfig = await repositories.getStatusPageConfigById(
      env.DB,
      userId
    );

    let configId: number;

    if (existingConfig && existingConfig.id) {
      // 更新现有配置
      await repositories.updateStatusPageConfig(
        env.DB,
        existingConfig.id,
        data.title,
        data.description,
        data.logoUrl,
        data.customCss
      );

      configId = existingConfig.id;
    } else {
      // 创建新配置
      const insertResult = await repositories.createStatusPageConfig(
        env.DB,
        userId,
        data.title,
        data.description,
        data.logoUrl,
        data.customCss
      );

      if (!insertResult || typeof insertResult.id !== "number") {
        throw new Error("创建状态页配置失败");
      }

      configId = insertResult.id;
    }

    // 清除现有的监控项关联
    await repositories.clearConfigMonitorLinks(env.DB, configId);

    // 清除现有的客户端关联
    await repositories.clearConfigAgentLinks(env.DB, configId);

    // 添加选定的监控项
    if (data.monitors && data.monitors.length > 0) {
      for (const monitorId of data.monitors) {
        await repositories.addMonitorToConfig(env.DB, configId, monitorId);
      }
    }

    // 添加选定的客户端
    if (data.agents && data.agents.length > 0) {
      for (const agentId of data.agents) {
        await repositories.addAgentToConfig(env.DB, configId, agentId);
      }
    }

    return { success: true, configId };
  } catch (error) {
    console.error("保存状态页配置失败:", error);
    throw new Error("保存状态页配置失败");
  }
}

/**
 * 获取状态页公开数据
 * @param env 环境变量，包含数据库连接
 * @returns 状态页公开数据
 */
export async function getStatusPagePublicData(env: { DB: Bindings["DB"] }) {
  // 获取所有配置
  const configsResult = await repositories.getAllStatusPageConfigs(env.DB);

  if (!configsResult.results || configsResult.results.length === 0) {
    console.log("没有找到任何配置");

    return {
      title: "故障状态",
      description: "没有找到任何数据，请检查",
      logoUrl: "",
      customCss: "",
      monitors: [],
      agents: [],
    };
  }

  // 简单处理：获取第一个配置
  const config = configsResult.results[0];

  // 获取选中的监控项
  const selectedMonitors = await repositories.getSelectedMonitors(
    env.DB,
    config.id as number
  );

  // 获取选中的客户端
  const selectedAgents = await repositories.getSelectedAgents(
    env.DB,
    config.id as number
  );

  // 获取监控项详细信息
  let monitors: any[] = [];
  if (selectedMonitors.results && selectedMonitors.results.length > 0) {
    const monitorIds = selectedMonitors.results.map((m) => m.monitor_id);
    if (monitorIds.length > 0) {
      for (const monitorId of monitorIds) {
        const monitor = await repositories.getMonitorById(env.DB, monitorId);
        const monitorDailyStats = await repositories.getMonitorDailyStatsById(
          env.DB,
          monitorId
        );
        const monitorHistory = await repositories.getMonitorStatusHistoryIn24h(
          env.DB,
          monitorId
        );
        monitors.push({
          ...monitor,
          dailyStats: monitorDailyStats.results,
          history: monitorHistory.results,
        });
      }
    }
  }

  // 获取客户端基本信息
  let agents: Agent[] = [];
  if (selectedAgents.results && selectedAgents.results.length > 0) {
    const agentIds = selectedAgents.results.map((a) => a.agent_id);

    if (agentIds.length > 0) {
      const agentsResult = await repositories.getAgentsByIds(env.DB, agentIds);

      if (agentsResult.results) {
        agents = agentsResult.results;
      }
    }
  }

  return {
    title: config.title,
    description: config.description,
    logoUrl: config.logo_url,
    customCss: config.custom_css,
    monitors: monitors,
    agents: agents,
  };
}
