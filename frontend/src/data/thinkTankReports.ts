import type { ThinkTankReport } from "@shared-types/thinkTank";

/**
 * 质点智库精选报告样本：覆盖能源、化工、医药等核心行业
 */
export const thinkTankReports: ThinkTankReport[] = [
  {
    id: "global-oil-gas-oilfield-services-2025",
    title: "全球油气开采与油田服务 · 结构性机会",
    summary:
      "拆解上游资本开支复苏、OPEC 政策与油服技术升级，识别 2025 年油服龙头的盈利弹性。",
    tags: ["能源", "技术迭代", "全球视角"],
    publishDate: "2025-07-03",
    filePath: "/reports/global-oil-gas.html",
    industryPath: { industry: "能源", subIndustry: "油气", segment: "油服" },
    metrics: { viewCount: 3200, downloadCount: 680, rating: 4.9 },
  },
  {
    id: "agricultural-chemicals-2025",
    title: "全球农用化工 · 转型窗口的攻守平衡",
    summary:
      "从油价、农产品价格与政策三个维度评估农化需求弹性，并量化龙头估值中枢。",
    tags: ["化工", "可持续", "海外需求"],
    publishDate: "2025-07-01",
    filePath: "/reports/agri-chemicals.html",
    industryPath: { industry: "原材料", subIndustry: "化工", segment: "农用化工" },
    metrics: { viewCount: 2650, downloadCount: 580, rating: 4.7 },
  },
  {
    id: "biological-pharmaceuticals-2025",
    title: "全球生物制药 · 管线价值与资本效率",
    summary:
      "梳理 mRNA、抗体偶联等核心赛道，构建“技术成熟度 × 商业化”双轴评估框架。",
    tags: ["医药", "创新药", "资本效率"],
    publishDate: "2025-07-02",
    filePath: "/reports/bio-pharma.html",
    industryPath: { industry: "医药卫生", subIndustry: "制药", segment: "生物药" },
    metrics: { viewCount: 4200, downloadCount: 920, rating: 4.9 },
  },
  {
    id: "industrial-metals-2025",
    title: "工业金属 · 供需错配与价格弹性",
    summary:
      "聚焦铜、锂、铝等关键品种的库存周期，并给出新能源链条的对冲策略。",
    tags: ["金属", "新能源", "供需"],
    publishDate: "2025-07-03",
    filePath: "/reports/industrial-metals.html",
    industryPath: { industry: "原材料", subIndustry: "有色金属", segment: "工业金属" },
    metrics: { viewCount: 3800, downloadCount: 820, rating: 4.8 },
  },
  {
    id: "infrastructure-digital-rail-2025",
    title: "数字基建 · 轨交智能化的投资抓手",
    summary:
      "剖析城际轨交数字化升级的政策节奏、招标数据与主设备厂商的订单兑现路径。",
    tags: ["基建", "数字化", "城轨"],
    publishDate: "2025-07-08",
    filePath: "/reports/digital-rail.html",
    industryPath: { industry: "工业", subIndustry: "交通设备", segment: "轨交" },
    metrics: { viewCount: 2100, downloadCount: 460, rating: 4.6 },
  },
  {
    id: "consumer-luxury-2025",
    title: "全球高端消费 · 中国需求新曲线",
    summary:
      "结合出入境数据与奢侈品牌渠道策略，判断 25Q3 需求修复的节奏与弹性。",
    tags: ["消费", "奢侈品", "渠道"],
    publishDate: "2025-07-10",
    filePath: "/reports/luxury-consumption.html",
    industryPath: { industry: "可选消费", subIndustry: "高端消费", segment: "奢侈品" },
    metrics: { viewCount: 2800, downloadCount: 510, rating: 4.7 },
  },
  {
    id: "tech-semiconductor-2025",
    title: "半导体设备 · 去库存后的产能再配置",
    summary:
      "追踪晶圆厂产能利用率、设备订单与国产替代率，量化关键设备厂的盈利弹性。",
    tags: ["科技", "半导体", "国产替代"],
    publishDate: "2025-07-12",
    filePath: "/reports/semiconductor-equipment.html",
    industryPath: { industry: "信息技术", subIndustry: "半导体", segment: "设备" },
    metrics: { viewCount: 3600, downloadCount: 760, rating: 4.8 },
  },
  {
    id: "clean-energy-storage-2025",
    title: "储能 · 全球招标与盈利模型",
    summary:
      "解析欧美储能招标价格、国内共享储能收益拆分，提供 IRR 场景测算模板。",
    tags: ["新能源", "储能", "收益模型"],
    publishDate: "2025-07-15",
    filePath: "/reports/energy-storage.html",
    industryPath: { industry: "公用事业", subIndustry: "新能源", segment: "储能" },
    metrics: { viewCount: 2950, downloadCount: 610, rating: 4.7 },
  },
];
