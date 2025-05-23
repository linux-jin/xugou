import { Bindings } from "../models/db";
import { migrateFrom003To004 } from "./migrate-0.0.3-to-0.0.4";
import { migrateFrom004To005 } from "./migrate-0.0.4-to-0.0.5";
import { migrateFrom007To008 } from "./migrate-0.0.7-to-0.0.8";

// 执行所有迁移脚本
export async function runMigrations(env: Bindings): Promise<void> {
  try {
    console.log("开始执行数据库迁移...");

    // 从v0.0.3迁移到v0.0.4
    const migration1Result = await migrateFrom003To004(env);
    console.log(`迁移 0.0.3 -> 0.0.4: ${migration1Result.message}`);

    // 从v0.0.4迁移到v0.0.5
    const migration2Result = await migrateFrom004To005(env);
    console.log(`迁移 0.0.4 -> 0.0.5: ${migration2Result.message}`);

    // 从 v0.0.7 迁移到 v0.0.8
    const migration3Result = await migrateFrom007To008(env);
    console.log(`迁移 0.0.7 -> 0.0.8: ${migration3Result.message}`)

    console.log("所有迁移已完成");
  } catch (error) {
    console.error("执行迁移脚本时出错:", error);
    throw error;
  }
}
