import { eq } from "drizzle-orm";
import {
  db,
  categoriesTable,
  citiesTable,
  neighborhoodsTable,
  offersTable,
  providersTable,
  providerServicesTable,
  sectorsTable,
  serviceRequestsTable,
  servicesTable,
  usersTable,
  walletsTable,
} from "@workspace/db";
import { logger } from "./logger";

const sectorSeed = [
  ["خدمات المنازل والسكن", "home-services", "home"],
  ["الرعاية والصحة والمساعدة الشخصية", "care-health", "heart"],
  ["التعليم، التكوين، الدروس والكوتشينغ", "education", "graduation-cap"],
  ["خدمات الشركات والمقاولات والجمعيات", "business-services", "briefcase"],
  ["النقل واللوجيستيك والتوزيع والتوصيل", "transport-logistics", "truck"],
  ["الاستشارات القانونية والاجتماعية والاقتصادية", "consulting", "scale"],
  ["التموين، الأفراح، الحفلات والمناسبات", "events-catering", "calendar"],
  ["العقار: كراء، بيع، شراء، إدارة الأملاك", "real-estate", "building"],
  ["سوق الشغل والموارد البشرية", "jobs-hr", "users"],
  ["السيارات", "cars", "car"],
  ["الإلكترونيات والأجهزة الرقمية", "electronics", "smartphone"],
  ["البيع المباشر للخدمات والمواد", "direct-sales", "shopping-bag"],
  ["الجمال، الحيوانات، الفلاحة والخدمات القروية", "lifestyle-rural", "sparkles"],
] as const;

const homeServices = [
  "الكهرباء", "الترصيص والسباكة", "الطبخ", "التنظيف", "الصباغة",
  "النجارة والألمنيوم", "الزجاج", "التكييف", "الكاميرات", "البستنة",
  "الديكور المنزلي", "البناء والترميم", "الأجهزة المنزلية", "مكافحة الحشرات",
  "الطاقة الشمسية المنزلية",
];

const carServices = [
  "الميكانيك", "كهرباء السيارات", "التشخيص الإلكتروني", "تغيير الزيت والفلاتر",
  "الفرامل", "البطاريات", "تنظيف وغسل السيارات", "التلميع", "جر السيارات",
  "فحص قبل الشراء", "كراء السيارات", "بيع وشراء السيارات", "قطع الغيار",
  "صيانة الدراجات النارية",
];

const electronicsServices = [
  "صيانة الهواتف", "تغيير الشاشة", "تغيير البطارية", "إصلاح الحواسيب",
  "صيانة الطابعات", "التلفاز", "الكاميرات", "الشبكات و Wi-Fi",
  "استرجاع البيانات", "بيع وتركيب الأجهزة",
];

const generalServices = [
  ["رعاية منزلية", 1],
  ["دروس الدعم والتقوية", 2],
  ["تصميم الهوية البصرية", 3],
  ["نقل الأثاث", 4],
  ["استشارة قانونية", 5],
  ["تنظيم حفلات", 6],
  ["كراء الشقق", 7],
  ["البحث عن المواهب", 8],
  ["تدريب مهني", 9],
  ["بيع المواد والخدمات", 11],
  ["تجميل ومكياج", 12],
] as const;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\u0600-\u06ff\w]+/g, "-")
    .replace(/^-|-$/g, "");

export async function ensureSeedData(): Promise<void> {
  const existingSectors = await db.select().from(sectorsTable).limit(1);
  if (existingSectors.length > 0) return;

  const sectors = await db
    .insert(sectorsTable)
    .values(
      sectorSeed.map(([name, slug, icon], index) => ({
        name,
        slug,
        icon,
        sortOrder: index,
      })),
    )
    .returning();

  const homeSector = sectors.find((sector) => sector.slug === "home-services");
  const carSector = sectors.find((sector) => sector.slug === "cars");
  const electronicsSector = sectors.find((sector) => sector.slug === "electronics");

  const categoryValues = sectors.map((sector) => ({
    sectorId: sector.id,
    name: sector.name,
    slug: sector.slug,
  }));
  const categories = await db.insert(categoriesTable).values(categoryValues).returning();

  const servicesToCreate = [
    ...homeServices.map((name) => ({ name, sectorId: homeSector?.id })),
    ...carServices.map((name) => ({ name, sectorId: carSector?.id })),
    ...electronicsServices.map((name) => ({ name, sectorId: electronicsSector?.id })),
    ...generalServices.map(([name, sectorIndex]) => ({
      name,
      sectorId: sectors[sectorIndex]?.id,
    })),
  ].filter((service): service is { name: string; sectorId: string } => Boolean(service.sectorId));

  const categoryBySector = new Map(categories.map((category) => [category.sectorId, category]));
  await db.insert(servicesTable).values(
    servicesToCreate.map((service) => ({
      categoryId: categoryBySector.get(service.sectorId)!.id,
      name: service.name,
      slug: slugify(service.name),
      description: `خدمة ${service.name} موثوقة عبر شبكة Ujobs`,
    })),
  );

  const [rabat] = await db
    .insert(citiesTable)
    .values({ name: "الرباط", region: "الرباط-سلا-القنيطرة" })
    .returning();
  const neighborhoods = await db
    .insert(neighborhoodsTable)
    .values([
      { cityId: rabat.id, name: "أكدال" },
      { cityId: rabat.id, name: "حي الرياض" },
      { cityId: rabat.id, name: "السويسي" },
      { cityId: rabat.id, name: "العكاري" },
    ])
    .returning();

  const [customer] = await db
    .insert(usersTable)
    .values({ phone: "+212600000001", fullName: "مريم العلوي", role: "customer" })
    .returning();
  const [providerUser] = await db
    .insert(usersTable)
    .values({ phone: "+212600000002", fullName: "ياسين أمين", role: "provider" })
    .returning();
  const [provider] = await db
    .insert(providersTable)
    .values({
      userId: providerUser.id,
      businessName: "أمين لخدمات المنزل",
      bio: "فريق مهني لخدمات الكهرباء والصيانة داخل الرباط.",
      verificationStatus: "verified",
      rating: 4.9,
      reviewCount: 28,
      movementRadiusKm: 25,
    })
    .returning();
  const [wallet] = await db
    .insert(walletsTable)
    .values({ providerId: provider.id, balance: 850 })
    .returning();
  const electricity = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.name, "الكهرباء"))
    .limit(1);
  if (electricity[0]) {
    await db.insert(providerServicesTable).values({
      providerId: provider.id,
      serviceId: electricity[0].id,
      cityId: rabat.id,
      priceFrom: 150,
      priceTo: 900,
    });
    const [request] = await db
      .insert(serviceRequestsTable)
      .values({
        customerId: customer.id,
        serviceId: electricity[0].id,
        cityId: rabat.id,
        neighborhoodId: neighborhoods[0].id,
        title: "إصلاح عطل كهربائي في المنزل",
        description: "أحتاج إلى فحص لوحة الكهرباء وإصلاح انقطاع متكرر في غرفة الجلوس.",
        budgetMin: 200,
        budgetMax: 600,
        urgent: true,
        status: "open",
      })
      .returning();
    await db.insert(offersTable).values({
      requestId: request.id,
      providerId: provider.id,
      amount: 350,
      message: "سأعاين العطل وأقدم الحل في نفس اليوم.",
      estimatedDays: 1,
      commission: 10,
    });
  }

  logger.info({ walletId: wallet.id }, "Ujobs demo data seeded");
}