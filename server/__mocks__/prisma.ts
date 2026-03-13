import { vi } from 'vitest';

const createMockModel = () => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  findFirstOrThrow: vi.fn(),
  findUniqueOrThrow: vi.fn(),
});

export const prismaMock = {
  user: createMockModel(),
  tenant: createMockModel(),
  department: createMockModel(),
  salesRecord: createMockModel(),
  target: createMockModel(),
  groupTarget: createMockModel(),
  group: createMockModel(),
  groupMember: createMockModel(),
  dataType: createMockModel(),
  displayConfig: createMockModel(),
  viewConfig: createMockModel(),
  integration: createMockModel(),
  auditLog: createMockModel(),
  systemSetting: createMockModel(),
  customField: createMockModel(),
  customSlide: createMockModel(),
  subscriptionHistory: createMockModel(),
  superAdmin: createMockModel(),
  $transaction: vi.fn((fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock)),
};

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));
