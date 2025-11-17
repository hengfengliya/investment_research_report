import type { IndustryNode } from "@shared-types/thinkTank";

/**
 * 行业级联结构：用于生成标签导航
 */
export const industryHierarchy: IndustryNode[] = [
  {
    name: "能源",
    description: "油气、储能、绿电等供需核心资产",
    children: [
      {
        name: "油气",
        description: "上游供给与服务商",
        children: [
          { name: "油服", description: "钻完井、增产与维修" },
          { name: "石油化工", description: "炼化及中游资产" },
        ],
      },
      {
        name: "新能源",
        description: "储能、电力、绿氢",
        children: [{ name: "储能", description: "电化学储能解决方案" }],
      },
    ],
  },
  {
    name: "原材料",
    description: "化工、有色金属及其上下游",
    children: [
      {
        name: "化工",
        description: "农化、特化、材料",
        children: [
          { name: "农用化工", description: "种植链核心材料" },
          { name: "特种材料", description: "高附加值化工品" },
        ],
      },
      {
        name: "有色金属",
        description: "新能源金属品种",
        children: [
          { name: "工业金属", description: "铜铝锂等大宗" },
          { name: "贵金属", description: "黄金白银等避险品" },
        ],
      },
    ],
  },
  {
    name: "医药卫生",
    description: "创新药、医疗服务",
    children: [
      {
        name: "制药",
        description: "生物与化学制药企业",
        children: [{ name: "生物药", description: "mRNA、ADC 等创新技术" }],
      },
    ],
  },
  {
    name: "工业",
    description: "装备制造与基础设施",
    children: [
      {
        name: "交通设备",
        description: "轨交、航运、汽车供应链",
        children: [{ name: "轨交", description: "信号系统与核心构件" }],
      },
      {
        name: "半导体",
        description: "设备与材料链",
        children: [{ name: "设备", description: "刻蚀、沉积等核心环节" }],
      },
    ],
  },
  {
    name: "可选消费",
    description: "高端消费、体验经济",
    children: [
      {
        name: "高端消费",
        description: "奢侈品、精品零售",
        children: [{ name: "奢侈品", description: "品牌矩阵与渠道策略" }],
      },
    ],
  },
];
