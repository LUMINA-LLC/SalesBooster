import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

const MIN_PASSWORD_LENGTH = 12;
const TENANT_ID = 1;
const DEFAULT_USER_PASSWORD = 'password1234';

function getAdminPassword(): string {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      'SEED_ADMIN_PASSWORD 環境変数が設定されていません。\n' +
        `.env ファイルに SEED_ADMIN_PASSWORD を設定してください（${MIN_PASSWORD_LENGTH}文字以上）`,
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_ADMIN_PASSWORD は${MIN_PASSWORD_LENGTH}文字以上である必要があります（現在: ${password.length}文字）`,
    );
  }
  return password;
}

async function main() {
  const adminPassword = getAdminPassword();
  const hashedUserPassword = hashSync(DEFAULT_USER_PASSWORD, 10);

  // --- テナント ---
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 30);

  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {
      slug: 'demo1',
      planType: 'TRIAL',
      isTrial: true,
      licenseStartDate: now,
      licenseEndDate: trialEnd,
    },
    create: {
      id: TENANT_ID,
      name: 'デフォルトテナント',
      slug: 'demo1',
      planType: 'TRIAL',
      isTrial: true,
      licenseStartDate: now,
      licenseEndDate: trialEnd,
    },
  });

  // サブスクリプション履歴
  const existingHistory = await prisma.subscriptionHistory.findFirst({
    where: { tenantId: TENANT_ID, action: 'TRIAL_START' },
  });
  if (!existingHistory) {
    await prisma.subscriptionHistory.create({
      data: {
        tenantId: TENANT_ID,
        action: 'TRIAL_START',
        planType: 'TRIAL',
        startDate: now,
        endDate: trialEnd,
        note: '30日間トライアル開始',
      },
    });
  }

  console.log('Tenant created: demo1 (with TRIAL license)');

  // --- SUPER_ADMIN（テナント横断管理者） ---
  // SUPER_ADMINはtenantId=nullなので複合ユニークが使えない → findFirst + create/update
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      email: 'superadmin@salesbooster.com',
      role: 'SUPER_ADMIN',
      tenantId: null,
    },
  });
  const superAdmin = existingSuperAdmin
    ? await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: { role: 'SUPER_ADMIN', tenantId: null },
      })
    : await prisma.user.create({
        data: {
          email: 'superadmin@salesbooster.com',
          password: hashSync(adminPassword, 10),
          name: 'スーパー管理者',
          role: 'SUPER_ADMIN',
          tenantId: null,
        },
      });

  console.log('Super Admin created:', superAdmin.email);

  // --- テナント管理者 ---
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: TENANT_ID, email: 'admin@salesbooster.com' },
    },
    update: { role: 'ADMIN', tenantId: TENANT_ID },
    create: {
      email: 'admin@salesbooster.com',
      password: hashSync(adminPassword, 10),
      name: '管理者',
      role: 'ADMIN',
      tenantId: TENANT_ID,
    },
  });

  console.log('User created:', adminUser.email);

  // --- 部署 ---
  const honsha = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: '本社', tenantId: TENANT_ID },
  });
  const eigyobu = await prisma.department.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: '営業部', tenantId: TENANT_ID },
  });

  console.log('Departments created:', honsha.name, eigyobu.name);

  // --- メンバー（Userとして作成） ---
  const usersData = [
    {
      name: '田中太郎',
      email: 'tanaka@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      name: '佐藤花子',
      email: 'sato.hanako@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    {
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    {
      name: '高橋美咲',
      email: 'takahashi@example.com',
      departmentId: 2,
      imageUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
    },
    {
      name: '渡辺健太',
      email: 'watanabe@example.com',
      departmentId: 2,
      imageUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
    },
    {
      name: '伊藤達也',
      email: 'ito@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/6.jpg',
    },
    {
      name: '山本大輔',
      email: 'yamamoto@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/7.jpg',
    },
    {
      name: '中村悠介',
      email: 'nakamura@example.com',
      departmentId: 2,
      imageUrl: 'https://randomuser.me/api/portraits/men/8.jpg',
    },
    {
      name: '小林誠',
      email: 'kobayashi@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/9.jpg',
    },
    {
      name: '加藤結衣',
      email: 'kato@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/women/10.jpg',
    },
    {
      name: '吉田雄介',
      email: 'yoshida@example.com',
      departmentId: 2,
      imageUrl: 'https://randomuser.me/api/portraits/men/11.jpg',
    },
    {
      name: '山田麻衣',
      email: 'yamada@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
    },
    {
      name: '佐々木翔',
      email: 'sasaki@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/13.jpg',
    },
    {
      name: '松本美穂',
      email: 'matsumoto@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/women/14.jpg',
    },
    {
      name: '井上拓海',
      email: 'inoue@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/15.jpg',
    },
    {
      name: '木村陽子',
      email: 'kimura@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/women/16.jpg',
    },
    {
      name: '林智也',
      email: 'hayashi@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/17.jpg',
    },
    {
      name: '清水咲良',
      email: 'shimizu@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/women/18.jpg',
    },
    {
      name: '山口健',
      email: 'yamaguchi@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/men/19.jpg',
    },
    {
      name: '森田愛',
      email: 'morita@example.com',
      departmentId: 1,
      imageUrl: 'https://randomuser.me/api/portraits/women/20.jpg',
    },
  ];

  for (const data of usersData) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: data.email } },
      update: {},
      create: {
        ...data,
        password: hashedUserPassword,
        role: 'USER',
        status: 'ACTIVE',
        tenantId: TENANT_ID,
      },
    });
  }

  console.log('Users created:', usersData.length);

  // --- グループ ---
  const groupsData = [
    { id: 1, name: '3Aグループ 支店1', managerId: null },
    { id: 2, name: '3Bグループ 支店2', managerId: null },
    { id: 3, name: '3Cグループ 本社', managerId: null },
  ];

  for (const data of groupsData) {
    await prisma.group.upsert({
      where: { id: data.id },
      update: {},
      create: { ...data, tenantId: TENANT_ID },
    });
  }

  console.log('Groups created:', groupsData.length);

  // --- データ種類（DataType） ---
  const defaultDataType = await prisma.dataType.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '売上',
      unit: 'MAN_YEN',
      color: '#3B82F6',
      sortOrder: 1,
      isActive: true,
      isDefault: true,
      tenantId: TENANT_ID,
    },
  });

  console.log('DataType created:', defaultDataType.name);

  const DATA_TYPE_ID = defaultDataType.id;

  // --- 目標 ---
  const users = await prisma.user.findMany({
    where: { tenantId: TENANT_ID, role: { not: 'SUPER_ADMIN' } },
  });
  // 管理者を除外（メンバーとして扱うユーザーのみ）
  const memberUsers = users.filter((u) => u.role === 'USER');

  for (const user of memberUsers) {
    const existing1 = await prisma.target.findFirst({
      where: { tenantId: TENANT_ID, userId: user.id, year: 2026, month: 1 },
    });
    if (!existing1) {
      await prisma.target.create({
        data: {
          userId: user.id,
          value: 1000000,
          year: 2026,
          month: 1,
          periodType: 'MONTHLY',
          tenantId: TENANT_ID,
          dataTypeId: DATA_TYPE_ID,
        },
      });
    }
  }

  console.log('Targets created for', memberUsers.length, 'users');

  // --- 売上レコード（2026年1月分のサンプル） ---
  const salesAmounts = [
    2460000, 1600000, 1360000, 1350000, 1260000, 950000, 890000, 860000, 780000,
    670000, 640000, 590000, 540000, 290000, 0, 0, 0, 0, 0, 0,
  ];

  for (let i = 0; i < memberUsers.length && i < salesAmounts.length; i++) {
    if (salesAmounts[i] > 0) {
      await prisma.salesRecord.create({
        data: {
          userId: memberUsers[i].id,
          value: salesAmounts[i],
          description: 'サンプル売上データ',
          recordDate: new Date(2026, 0, 15),
          tenantId: TENANT_ID,
          dataTypeId: DATA_TYPE_ID,
        },
      });
    }
  }

  console.log('Sales records created (January)');

  // --- 売上レコード（2026年2月分のサンプル） ---
  const salesDataFeb: { value: number; day: number }[][] = [
    // 田中太郎
    [
      { value: 800000, day: 3 },
      { value: 650000, day: 5 },
      { value: 420000, day: 7 },
    ],
    // 佐藤花子
    [
      { value: 500000, day: 2 },
      { value: 700000, day: 4 },
      { value: 350000, day: 6 },
    ],
    // 鈴木一郎
    [
      { value: 600000, day: 1 },
      { value: 400000, day: 3 },
      { value: 300000, day: 6 },
    ],
    // 高橋美咲
    [
      { value: 450000, day: 2 },
      { value: 550000, day: 5 },
    ],
    // 渡辺健太
    [
      { value: 380000, day: 1 },
      { value: 420000, day: 4 },
      { value: 300000, day: 7 },
    ],
    // 伊藤達也
    [
      { value: 500000, day: 3 },
      { value: 350000, day: 6 },
    ],
    // 山本大輔
    [
      { value: 400000, day: 2 },
      { value: 300000, day: 5 },
    ],
    // 中村悠介
    [
      { value: 350000, day: 1 },
      { value: 250000, day: 4 },
      { value: 200000, day: 7 },
    ],
    // 小林誠
    [
      { value: 300000, day: 3 },
      { value: 400000, day: 6 },
    ],
    // 加藤結衣
    [
      { value: 280000, day: 2 },
      { value: 350000, day: 5 },
    ],
    // 吉田雄介
    [
      { value: 250000, day: 1 },
      { value: 300000, day: 4 },
    ],
    // 山田麻衣
    [
      { value: 200000, day: 3 },
      { value: 350000, day: 6 },
    ],
    // 佐々木翔
    [
      { value: 180000, day: 2 },
      { value: 280000, day: 5 },
    ],
    // 松本美穂
    [
      { value: 150000, day: 4 },
      { value: 200000, day: 7 },
    ],
    // 井上拓海
    [{ value: 120000, day: 1 }],
    // 木村陽子
    [{ value: 100000, day: 3 }],
    // 林智也
    [],
    // 清水咲良
    [],
    // 山口健
    [],
    // 森田愛
    [],
  ];

  for (let i = 0; i < memberUsers.length && i < salesDataFeb.length; i++) {
    for (const record of salesDataFeb[i]) {
      await prisma.salesRecord.create({
        data: {
          userId: memberUsers[i].id,
          value: record.value,
          description: '2月サンプル売上データ',
          recordDate: new Date(2026, 1, record.day),
          tenantId: TENANT_ID,
          dataTypeId: DATA_TYPE_ID,
        },
      });
    }
  }

  // 2月の目標
  for (const user of memberUsers) {
    const existing2 = await prisma.target.findFirst({
      where: { tenantId: TENANT_ID, userId: user.id, year: 2026, month: 2 },
    });
    if (!existing2) {
      await prisma.target.create({
        data: {
          userId: user.id,
          value: 1000000,
          year: 2026,
          month: 2,
          periodType: 'MONTHLY',
          tenantId: TENANT_ID,
          dataTypeId: DATA_TYPE_ID,
        },
      });
    }
  }

  console.log('Sales records & targets created (February)');

  // --- 売上レコード（2026年3月分のサンプル） ---
  const salesDataMar: { value: number; day: number }[][] = [
    // 田中太郎
    [
      { value: 900000, day: 1 },
      { value: 720000, day: 4 },
      { value: 530000, day: 7 },
      { value: 410000, day: 10 },
    ],
    // 佐藤花子
    [
      { value: 680000, day: 2 },
      { value: 550000, day: 5 },
      { value: 480000, day: 8 },
    ],
    // 鈴木一郎
    [
      { value: 750000, day: 1 },
      { value: 480000, day: 4 },
      { value: 350000, day: 9 },
    ],
    // 高橋美咲
    [
      { value: 520000, day: 3 },
      { value: 610000, day: 6 },
      { value: 280000, day: 10 },
    ],
    // 渡辺健太
    [
      { value: 450000, day: 2 },
      { value: 380000, day: 5 },
      { value: 420000, day: 8 },
    ],
    // 伊藤達也
    [
      { value: 600000, day: 1 },
      { value: 430000, day: 6 },
      { value: 310000, day: 9 },
    ],
    // 山本大輔
    [
      { value: 520000, day: 3 },
      { value: 380000, day: 7 },
    ],
    // 中村悠介
    [
      { value: 400000, day: 2 },
      { value: 320000, day: 5 },
      { value: 280000, day: 10 },
    ],
    // 小林誠
    [
      { value: 350000, day: 1 },
      { value: 450000, day: 4 },
      { value: 200000, day: 8 },
    ],
    // 加藤結衣
    [
      { value: 320000, day: 3 },
      { value: 400000, day: 6 },
      { value: 180000, day: 9 },
    ],
    // 吉田雄介
    [
      { value: 300000, day: 2 },
      { value: 350000, day: 7 },
    ],
    // 山田麻衣
    [
      { value: 250000, day: 1 },
      { value: 400000, day: 5 },
      { value: 150000, day: 10 },
    ],
    // 佐々木翔
    [
      { value: 220000, day: 3 },
      { value: 310000, day: 8 },
    ],
    // 松本美穂
    [
      { value: 180000, day: 2 },
      { value: 250000, day: 6 },
    ],
    // 井上拓海
    [
      { value: 150000, day: 4 },
      { value: 200000, day: 9 },
    ],
    // 木村陽子
    [
      { value: 130000, day: 1 },
      { value: 180000, day: 7 },
    ],
    // 林智也
    [{ value: 100000, day: 3 }],
    // 清水咲良
    [{ value: 80000, day: 5 }],
    // 山口健
    [],
    // 森田愛
    [],
  ];

  for (let i = 0; i < memberUsers.length && i < salesDataMar.length; i++) {
    for (const record of salesDataMar[i]) {
      await prisma.salesRecord.create({
        data: {
          userId: memberUsers[i].id,
          value: record.value,
          description: '3月サンプル売上データ',
          recordDate: new Date(2026, 2, record.day),
          tenantId: TENANT_ID,
          dataTypeId: DATA_TYPE_ID,
        },
      });
    }
  }

  // 3月の目標
  for (const user of memberUsers) {
    const existing3 = await prisma.target.findFirst({
      where: { tenantId: TENANT_ID, userId: user.id, year: 2026, month: 3 },
    });
    if (!existing3) {
      await prisma.target.create({
        data: {
          userId: user.id,
          value: 1000000,
          year: 2026,
          month: 3,
          periodType: 'MONTHLY',
          tenantId: TENANT_ID,
          dataTypeId: DATA_TYPE_ID,
        },
      });
    }
  }

  console.log('Sales records & targets created (March)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
