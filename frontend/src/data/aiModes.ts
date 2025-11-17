/**
 * 辰星 AI 模式配置：用于生成模式按钮与提示语
 */
export interface AiMode {
  id: string;
  label: string;
  icon: string;
  description: string;
  placeholder: string;
  samples: string[];
}

export const aiModes: AiMode[] = [
  {
    id: "all",
    label: "全域洞察",
    icon: "layers",
    description: "自动组合行业、公司与宏观多维分析，快速得到结构化要点",
    placeholder: "想了解某个行业、公司或策略？直接输入问题即可。",
    samples: ["梳理 25 年光伏海外需求的拐点信号", "复盘顺周期板块的盈利修复路径"],
  },
  {
    id: "industry",
    label: "行业研判",
    icon: "factory",
    description: "结合内外部数据输出行业级风险与机会",
    placeholder: "输入行业 + 关注要点，例如“半导体 去库存进展”。",
    samples: ["判断工业金属供需紧平衡能维持多久", "总结轨交智能化改造的政策节奏"],
  },
  {
    id: "company",
    label: "公司深描",
    icon: "building",
    description: "聚焦商业模式、财务与估值三张表的联动",
    placeholder: "输入公司名称或股票代码，系统会补全财务背景。",
    samples: ["用 FCFF 框架测算宁德时代", "比较两家油服公司的盈利质量"],
  },
  {
    id: "quant",
    label: "量化辅助",
    icon: "chart",
    description: "生成可立即使用的量化假设与指标组合",
    placeholder: "描述策略想法，例如“高股息 + 盈利上修组合”。",
    samples: ["构建基于盈利上修的 A50 监控模型", "讨论高分红组合的回撤控制方法"],
  },
  {
    id: "insight",
    label: "会议备忘",
    icon: "lightbulb",
    description: "快速整理调研纪要并列出行动项",
    placeholder: "输入会议背景或要点，AI 会补全追问与结构。",
    samples: ["整理与新能源 Tier1 沟通的关键问题", "生成芯片行业调研的追问列表"],
  },
];
