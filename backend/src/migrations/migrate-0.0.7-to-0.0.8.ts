/**
 * 迁移脚本: 从0.0.4版本迁移到0.0.5版本
 * 主要变更: 修正 notification_templates 表中的 type 字段值
 */

import { Bindings } from "../models/db";

/**
 * 检查表是否存在
 */
export async function tableExists(
  env: Bindings,
  table: string
): Promise<boolean> {
  try {
    const result = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    )
      .bind(table)
      .first<{ name: string }>();

    return !!result;
  } catch (error) {
    console.error(`检查表 ${table} 是否存在时出错:`, error);
    return false;
  }
}

export async function migrateFrom007To008(
  env: Bindings
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("开始从v0.0.4迁移到v0.0.5...");

    // 检查 agents 表是否存在
    const hasTemplatesTable = await tableExists(env, "agents");

    if (!hasTemplatesTable) {
      console.log("agents 表不存在，跳过迁移");
      return {
        success: true,
        message: "agents 表不存在，跳过迁移",
      };
    }
    await env.DB.exec("ALTER TABLE agents ADD COLUMN keepalive TEXT");

    console.log(`迁移完成`);

    return {
      success: true,
      message: `从v0.0.7到v0.0.8的迁移成功完成`,
    };
  } catch (error) {
    console.error("迁移错误:", error);
    return {
      success: false,
      message: `迁移失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
