import { prisma } from '@/lib/prisma';
import { DisplayConfigInput } from '../lib/displayConfigTypes';
import { buildConfigData, CONFIG_INCLUDE } from '../lib/displayConfigMapper';

export const displayConfigRepository = {
  /** テナント内の全設定（作成順）。一覧・選択画面用。 */
  async findAll(tenantId: number) {
    return prisma.displayConfig.findMany({
      where: { tenantId },
      include: CONFIG_INCLUDE,
      orderBy: { id: 'asc' },
    });
  },

  /** テナント内の最初の1件（既存挙動の互換。設定が無ければ null）。 */
  async find(tenantId: number) {
    return prisma.displayConfig.findFirst({
      where: { tenantId },
      include: CONFIG_INCLUDE,
      orderBy: { id: 'asc' },
    });
  },

  /** configId 指定で取得（テナント越境を防ぐため tenantId も条件に含める）。 */
  async findById(tenantId: number, configId: number) {
    return prisma.displayConfig.findFirst({
      where: { id: configId, tenantId },
      include: CONFIG_INCLUDE,
    });
  },

  /** テナント内の設定件数。 */
  async count(tenantId: number) {
    return prisma.displayConfig.count({ where: { tenantId } });
  },

  /** 新規設定を作成する。 */
  async create(tenantId: number, data: DisplayConfigInput) {
    return prisma.displayConfig.create({
      data: { tenantId, ...buildConfigData(data) },
      include: CONFIG_INCLUDE,
    });
  },

  /** configId 指定で設定を更新する（ビュー・速報は作り直し）。 */
  async update(tenantId: number, configId: number, data: DisplayConfigInput) {
    return prisma.$transaction(async (tx) => {
      // テナント越境防止: 対象設定が自テナントのものか確認
      const existing = await tx.displayConfig.findFirst({
        where: { id: configId, tenantId },
        select: { id: true },
      });
      if (!existing) return null;

      await tx.displayConfigView.deleteMany({
        where: { displayConfigId: configId },
      });
      await tx.displayConfigBreakingNews.deleteMany({
        where: { displayConfigId: configId },
      });
      return tx.displayConfig.update({
        where: { id: configId },
        data: buildConfigData(data),
        include: CONFIG_INCLUDE,
      });
    });
  },

  /**
   * 設定を upsert する（既存挙動の互換用。テナントの最初の1件を更新、無ければ作成）。
   * 複数設定 UI からは update/create を直接使う。
   */
  async upsert(tenantId: number, data: DisplayConfigInput) {
    const existing = await prisma.displayConfig.findFirst({
      where: { tenantId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    if (existing) {
      return this.update(tenantId, existing.id, data);
    }
    return this.create(tenantId, data);
  },

  /** configId 指定で設定を削除する（自テナントのもののみ）。 */
  async delete(tenantId: number, configId: number) {
    const result = await prisma.displayConfig.deleteMany({
      where: { id: configId, tenantId },
    });
    return result.count > 0;
  },

  /** configId 指定で設定名を変更する（自テナントのもののみ）。 */
  async rename(tenantId: number, configId: number, name: string) {
    const result = await prisma.displayConfig.updateMany({
      where: { id: configId, tenantId },
      data: { name },
    });
    return result.count > 0;
  },

  /**
   * データ種別ごとの速報設定を返す。
   * configId 指定があればその設定、無ければテナントの最初の1件。
   */
  async findBreakingNewsConfig(tenantId: number, configId?: number) {
    const config = await prisma.displayConfig.findFirst({
      where: configId ? { id: configId, tenantId } : { tenantId },
      orderBy: { id: 'asc' },
      select: {
        breakingNewsConfigs: {
          select: {
            dataTypeId: true,
            enabled: true,
            breakingNewsMessage: true,
            breakingNewsVideoId: true,
          },
        },
      },
    });
    return config;
  },
};
