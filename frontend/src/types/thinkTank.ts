/**
 * 质点智库类型定义：用于描述报告和行业级联结构
 */
export interface IndustryPath {
  industry: string;
  subIndustry: string;
  segment: string;
}

export interface ReportMetrics {
  viewCount: number;
  downloadCount: number;
  rating: number;
}

export interface ThinkTankReport {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  publishDate: string;
  filePath: string;
  industryPath: IndustryPath;
  metrics: ReportMetrics;
}

export interface IndustryNode {
  name: string;
  description: string;
  children?: IndustryNode[];
}
