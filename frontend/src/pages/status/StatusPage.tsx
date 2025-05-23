import { useState, useEffect } from "react";
import { Box, Flex, Heading, Text, Grid, Theme } from "@radix-ui/themes";
import { Badge } from "@/components/ui";
import { getStatusPageData } from "../../api/status";
import AgentCard from "../../components/AgentCard";
import MonitorCard from "../../components/MonitorCard";
import { useTranslation } from "react-i18next";
import { Agent, MonitorWithDailyStatsAndStatusHistory } from "../../types";
import { getAgentMetrics } from "../../api";

const StatusPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<{
    monitors: MonitorWithDailyStatsAndStatusHistory[];
    agents: Agent[];
  }>({
    monitors: [],
    agents: [],
  });
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>(t("statusPage.title"));
  const [pageDescription, setPageDescription] = useState<string>(
    t("statusPage.allOperational")
  );
  const [error, setError] = useState<string | null>(null);

  // 从API获取数据
  useEffect(() => {
    fetchData();
    // 设置定时刷新，每分钟更新数据
    const intervalId = setInterval(() => {
      fetchData();
    }, 180000); // 180000ms = 3分钟

    // 组件卸载时清除定时器和取消请求
    return () => {
      clearInterval(intervalId);
    };
  }, []); // 依赖于 t 函数

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    const response = await getStatusPageData();

    if (response) {
      // 设置页面标题和描述
      setPageTitle(response.title || t("statusPage.title"));
      setPageDescription(
        response.description || t("statusPage.allOperational")
      );
      if (response.agents) {
        // 获取每个代理的指标数据
        await Promise.all(
          response.agents.map(async (agent) => {
            const metrics = await getAgentMetrics(agent.id);
            agent.metrics = metrics.agent || [];
          })
        );
      }
      console.log(response);
      setData({
        monitors: response.monitors || [],
        agents: response.agents || [],
      });
    } else {
      setError(t("statusPage.fetchError"));
    }
    setLoading(false);
  };

  // 错误显示
  if (error) {
    return (
      <Theme appearance="light">
        <Box>
          <div className="page-container">
            <Flex justify="center" align="center">
              <Text size="3">{error}</Text>
            </Flex>
          </div>
        </Box>
      </Theme>
    );
  }

  if (loading) {
    return (
      <Theme appearance="light">
        <Box>
          <div className="page-container">
            <Flex justify="center" align="center">
              <Text size="3">{t("common.loading")}</Text>
            </Flex>
          </div>
        </Box>
      </Theme>
    );
  }

  return (
    <Theme appearance="light">
      <Box>
        <div className="page-container">
          {/* 状态页标题区域 */}
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="9"
            gap="5"
          >
            <Heading size="9" align="center">
              {pageTitle}
            </Heading>
            <Text size="5" align="center">
              {pageDescription}
            </Text>
            <Flex gap="2" mt="2">
              <Badge>
                {t("statusPage.lastUpdated")}: {t("statusPage.justNow")}
              </Badge>
            </Flex>
          </Flex>

          {/* API服务状态 */}
          {data.monitors.length > 0 && (
            <Box py="6">
              <Heading size="5" mb="4">
                {t("statusPage.apiServices")}
              </Heading>
              <Grid columns={{ initial: "1" }} gap="4">
                {data.monitors.map((monitor) => (
                  <MonitorCard monitor={monitor} />
                ))}
              </Grid>
            </Box>
          )}

          {/* 客户端监控状态 */}
          {data.agents.length > 0 && (
            <Box py="6">
              <Heading size="5" mb="4">
                {t("statusPage.agentStatus")}
              </Heading>
              <Grid columns={{ initial: "1" }} gap="4">
                {data.agents.map((agent) => (
                  <Box key={agent.id}>
                    <AgentCard agent={agent} showIpAddress={false} />
                  </Box>
                ))}
              </Grid>
            </Box>
          )}
        </div>
      </Box>
    </Theme>
  );
};

export default StatusPage;
