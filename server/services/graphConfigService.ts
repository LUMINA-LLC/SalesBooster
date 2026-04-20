import { graphConfigRepository } from '../repositories/graphConfigRepository';
import {
  GraphConfig,
  DEFAULT_GRAPH_CONFIG,
  BarStyle,
  EffectIntensity,
  DefaultGraphType,
  DefaultPeriodUnit,
} from '@/types/graph';

export const graphConfigService = {
  async getConfig(tenantId: number): Promise<GraphConfig> {
    const record = await graphConfigRepository.find(tenantId);
    if (!record) return DEFAULT_GRAPH_CONFIG;
    return {
      topColor: record.topColor,
      centerColor: record.centerColor,
      lowColor: record.lowColor,
      barStyle: record.barStyle as BarStyle,
      showNormaLine: record.showNormaLine,
      darkMode: record.darkMode,
      gradientIntensity: record.gradientIntensity as EffectIntensity,
      glowIntensity: record.glowIntensity as EffectIntensity,
      rankingLimit: record.rankingLimit,
      defaultGraphType: record.defaultGraphType as DefaultGraphType,
      defaultPeriodUnit: record.defaultPeriodUnit as DefaultPeriodUnit,
    };
  },

  async updateConfig(tenantId: number, config: GraphConfig): Promise<void> {
    await graphConfigRepository.upsert(tenantId, {
      topColor: config.topColor,
      centerColor: config.centerColor,
      lowColor: config.lowColor,
      barStyle: config.barStyle,
      showNormaLine: config.showNormaLine,
      darkMode: config.darkMode,
      gradientIntensity: config.gradientIntensity,
      glowIntensity: config.glowIntensity,
      rankingLimit: config.rankingLimit,
      defaultGraphType: config.defaultGraphType,
      defaultPeriodUnit: config.defaultPeriodUnit,
    });
  },
};
