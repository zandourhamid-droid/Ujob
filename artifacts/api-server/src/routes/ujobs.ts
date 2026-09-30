import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AcceptOfferParams,
  AcceptOfferResponse,
  CreateComplaintBody,
  CreateComplaintResponse,
  CreateOfferBody,
  CreateOfferParams,
  CreateOfferResponse,
  CreateServiceRequestBody,
  CreateServiceRequestResponse,
  CreateTopupBody,
  CreateTopupResponse,
  GetAdminOverviewResponse,
  GetDashboardSummaryResponse,
  GetServiceRequestResponse,
  GetWalletResponse,
  ListCitiesResponse,
  ListSectorsResponse,
  ListServicesQueryParams,
  ListServicesResponse,
  ListServiceRequestsQueryParams,
  ListServiceRequestsResponse,
  ListWalletTransactionsResponse,
} from "@workspace/api-zod";
import {
  bookingsTable,
  categoriesTable,
  citiesTable,
  commissionsTable,
  complaintsTable,
  db,
  neighborhoodsTable,
  offersTable,
  paymentIntentsTable,
  providersTable,
  sectorsTable,
  serviceRequestsTable,
  servicesTable,
  usersTable,
  walletsTable,
  walletTransactionsTable,
} from "@workspace/db";
import { ensureSeedData } from "../lib/seed";
import { getStripePublishableKey, getUncachableStripeClient } from "../lib/stripeClient";
import { creditSucceededStripeTopup } from "../lib/stripeTopup";

const router: IRouter = Router();
const FIXED_COMMISSION_MAD = 10;

async function defaultCustomer() {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.role, "customer")).limit(1);
  return user;
}

async function defaultProvider() {
  const [provider] = await db.select().from(providersTable).limit(1);
  return provider;
}

router.get("/catalog/sectors", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const rows = await db
    .select({
      id: sectorsTable.id,
      name: sectorsTable.name,
      slug: sectorsTable.slug,
      icon: sectorsTable.icon,
      serviceCount: count(servicesTable.id),
    })
    .from(sectorsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.sectorId, sectorsTable.id))
    .leftJoin(servicesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .where(eq(sectorsTable.isActive, true))
    .groupBy(sectorsTable.id)
    .orderBy(sectorsTable.sortOrder);
  res.json(ListSectorsResponse.parse(rows));
});

router.get("/catalog/services", async (req, res): Promise<void> => {
  await ensureSeedData();
  const parsed = ListServicesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const filters = [eq(servicesTable.isActive, true)];
  if (parsed.data.search) filters.push(ilike(servicesTable.name, `%${parsed.data.search}%`));
  const rows = await db
    .select({
      id: servicesTable.id,
      sectorId: sectorsTable.id,
      sectorName: sectorsTable.name,
      name: servicesTable.name,
      slug: servicesTable.slug,
      description: servicesTable.description,
      providerCount: count(providersTable.id),
    })
    .from(servicesTable)
    .innerJoin(categoriesTable, eq(categoriesTable.id, servicesTable.categoryId))
    .innerJoin(sectorsTable, eq(sectorsTable.id, categoriesTable.sectorId))
    .leftJoin(providersTable, sql`true`)
    .where(and(...filters, parsed.data.sectorId ? eq(sectorsTable.id, parsed.data.sectorId) : undefined))
    .groupBy(servicesTable.id, sectorsTable.id)
    .orderBy(sectorsTable.sortOrder, servicesTable.name);
  res.json(ListServicesResponse.parse(rows));
});

router.get("/catalog/cities", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const rows = await db
    .select({
      cityId: citiesTable.id,
      cityName: citiesTable.name,
      region: citiesTable.region,
      neighborhoodId: neighborhoodsTable.id,
      neighborhoodName: neighborhoodsTable.name,
    })
    .from(citiesTable)
    .leftJoin(neighborhoodsTable, eq(neighborhoodsTable.cityId, citiesTable.id))
    .where(eq(citiesTable.isActive, true))
    .orderBy(citiesTable.name, neighborhoodsTable.name);
  const cities = rows.reduce<Array<{ id: string; name: string; region: string; neighborhoods: Array<{ id: string; name: string }> }>>(
    (result, row) => {
      let city = result.find((item) => item.id === row.cityId);
      if (!city) {
        city = { id: row.cityId, name: row.cityName, region: row.region, neighborhoods: [] };
        result.push(city);
      }
      if (row.neighborhoodId && row.neighborhoodName) {
        city.neighborhoods.push({ id: row.neighborhoodId, name: row.neighborhoodName });
      }
      return result;
    },
    [],
  );
  res.json(ListCitiesResponse.parse(cities));
});

async function dashboardSummary() {
  const [[providerCount], [verifiedCount], [requestCount], [openCount], [completedCount], [commissionTotal], [cityCount]] =
    await Promise.all([
      db.select({ value: count() }).from(providersTable),
      db.select({ value: count() }).from(providersTable).where(eq(providersTable.verificationStatus, "verified")),
      db.select({ value: count() }).from(serviceRequestsTable),
      db.select({ value: count() }).from(serviceRequestsTable).where(eq(serviceRequestsTable.status, "open")),
      db.select({ value: count() }).from(serviceRequestsTable).where(eq(serviceRequestsTable.status, "completed")),
      db.select({ value: sql<number>`coalesce(sum(${commissionsTable.amount}), 0)` }).from(commissionsTable),
      db.select({ value: count() }).from(citiesTable).where(eq(citiesTable.isActive, true)),
    ]);
  return {
    totalProviders: Number(providerCount.value),
    verifiedProviders: Number(verifiedCount.value),
    totalRequests: Number(requestCount.value),
    openRequests: Number(openCount.value),
    completedRequests: Number(completedCount.value),
    totalCommissions: Number(commissionTotal.value),
    activeCities: Number(cityCount.value),
  };
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  await ensureSeedData();
  res.json(GetDashboardSummaryResponse.parse(await dashboardSummary()));
});

async function requestRows(limit = 20, status?: string, cityId?: string) {
  const filters = [status ? eq(serviceRequestsTable.status, status) : undefined, cityId ? eq(serviceRequestsTable.cityId, cityId) : undefined];
  return db
    .select({
      id: serviceRequestsTable.id,
      serviceId: servicesTable.id,
      serviceName: servicesTable.name,
      cityName: citiesTable.name,
      neighborhoodName: neighborhoodsTable.name,
      title: serviceRequestsTable.title,
      description: serviceRequestsTable.description,
      budgetMin: serviceRequestsTable.budgetMin,
      budgetMax: serviceRequestsTable.budgetMax,
      urgent: serviceRequestsTable.urgent,
      status: serviceRequestsTable.status,
      offersCount: count(offersTable.id),
      createdAt: serviceRequestsTable.createdAt,
    })
    .from(serviceRequestsTable)
    .innerJoin(servicesTable, eq(servicesTable.id, serviceRequestsTable.serviceId))
    .innerJoin(citiesTable, eq(citiesTable.id, serviceRequestsTable.cityId))
    .innerJoin(neighborhoodsTable, eq(neighborhoodsTable.id, serviceRequestsTable.neighborhoodId))
    .leftJoin(offersTable, eq(offersTable.requestId, serviceRequestsTable.id))
    .where(and(...filters))
    .groupBy(serviceRequestsTable.id, servicesTable.id, citiesTable.id, neighborhoodsTable.id)
    .orderBy(desc(serviceRequestsTable.createdAt))
    .limit(limit);
}

router.get("/service-requests", async (req, res): Promise<void> => {
  await ensureSeedData();
  const parsed = ListServiceRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(ListServiceRequestsResponse.parse(await requestRows(parsed.data.limit, parsed.data.status, parsed.data.cityId)));
});

router.post("/service-requests", async (req, res): Promise<void> => {
  await ensureSeedData();
  const parsed = CreateServiceRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const customer = await defaultCustomer();
  if (!customer) {
    res.status(400).json({ error: "No customer account available" });
    return;
  }
  const [request] = await db.insert(serviceRequestsTable).values({
    ...parsed.data,
    customerId: customer.id,
    images: parsed.data.images ?? [],
    urgent: parsed.data.urgent ?? false,
  }).returning();
  const [created] = await requestRows(1, undefined, undefined);
  res.status(201).json(CreateServiceRequestResponse.parse(created ?? request));
});

router.get("/service-requests/:id", async (req, res): Promise<void> => {
  await ensureSeedData();
  const requests = await requestRows(100);
  const found = requests.find((item) => item.id === req.params.id);
  if (!found) {
    res.status(404).json({ error: "Service request not found" });
    return;
  }
  const offers = await db
    .select({
      id: offersTable.id,
      requestId: offersTable.requestId,
      providerId: providersTable.id,
      providerName: providersTable.businessName,
      amount: offersTable.amount,
      message: offersTable.message,
      estimatedDays: offersTable.estimatedDays,
      commission: offersTable.commission,
      status: offersTable.status,
      createdAt: offersTable.createdAt,
    })
    .from(offersTable)
    .innerJoin(providersTable, eq(providersTable.id, offersTable.providerId))
    .where(eq(offersTable.requestId, found.id))
    .orderBy(desc(offersTable.createdAt));
  res.json(GetServiceRequestResponse.parse({ ...found, offers }));
});

router.post("/service-requests/:id/offers", async (req, res): Promise<void> => {
  await ensureSeedData();
  const params = CreateOfferParams.safeParse(req.params);
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid offer" });
    return;
  }
  const provider = await defaultProvider();
  if (!provider) {
    res.status(400).json({ error: "No provider account available" });
    return;
  }
  const commission = FIXED_COMMISSION_MAD;
  const [offer] = await db.insert(offersTable).values({
    requestId: params.data.id,
    providerId: provider.id,
    ...parsed.data,
    commission,
  }).returning();
  res.status(201).json(CreateOfferResponse.parse({
    ...offer,
    providerName: provider.businessName,
  }));
});

router.post("/offers/:id/accept", async (req, res): Promise<void> => {
  await ensureSeedData();
  const params = AcceptOfferParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const provider = await defaultProvider();
  if (!provider) {
    res.status(400).json({ error: "No provider account available" });
    return;
  }
  try {
    const booking = await db.transaction(async (tx) => {
      const [offer] = await tx.select().from(offersTable).where(eq(offersTable.id, params.data.id)).limit(1);
      if (!offer) throw new Error("Offer not found");
      const [request] = await tx.select().from(serviceRequestsTable).where(eq(serviceRequestsTable.id, offer.requestId)).limit(1);
      const [wallet] = await tx.select().from(walletsTable).where(eq(walletsTable.providerId, offer.providerId)).limit(1);
      if (!request || !wallet) throw new Error("Booking data not found");
      if (wallet.balance < offer.commission) throw new Error("INSUFFICIENT_BALANCE");
      const [updatedWallet] = await tx.update(walletsTable).set({ balance: wallet.balance - offer.commission, updatedAt: new Date() }).where(eq(walletsTable.id, wallet.id)).returning();
      await tx.insert(walletTransactionsTable).values({
        walletId: wallet.id,
        type: "commission",
        amount: -offer.commission,
        balanceAfter: updatedWallet.balance,
        description: `عمولة قبول طلب: ${request.title}`,
        referenceId: offer.id,
      });
      const [createdBooking] = await tx.insert(bookingsTable).values({
        requestId: request.id,
        offerId: offer.id,
        customerId: request.customerId,
        providerId: offer.providerId,
        commission: offer.commission,
      }).returning();
      await tx.insert(commissionsTable).values({
        bookingId: createdBooking.id,
        providerId: offer.providerId,
        amount: offer.commission,
        rate: 0,
      });
      await tx.update(offersTable).set({ status: "accepted", updatedAt: new Date() }).where(eq(offersTable.id, offer.id));
      await tx.update(serviceRequestsTable).set({ status: "booked", updatedAt: new Date() }).where(eq(serviceRequestsTable.id, request.id));
      return createdBooking;
    });
    res.json(AcceptOfferResponse.parse(booking));
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      res.status(402).json({ error: "Insufficient wallet balance", code: "INSUFFICIENT_BALANCE" });
      return;
    }
    if (error instanceof Error && error.message === "Offer not found") {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.get("/wallet", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const provider = await defaultProvider();
  const [wallet] = provider ? await db.select().from(walletsTable).where(eq(walletsTable.providerId, provider.id)).limit(1) : [];
  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }
  res.json(GetWalletResponse.parse(wallet));
});

router.post("/wallet/topups", async (req, res): Promise<void> => {
  await ensureSeedData();
  const parsed = CreateTopupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const provider = await defaultProvider();
  const customer = await defaultCustomer();
  if (!provider || !customer) {
    res.status(400).json({ error: "Account not available" });
    return;
  }
  const providerName = parsed.data.provider ?? "sandbox";
  if (providerName === "stripe") {
    const stripe = await getUncachableStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsed.data.amount * 100),
      currency: "mad",
      automatic_payment_methods: { enabled: true },
      metadata: { userId: customer.id, providerId: provider.id },
      description: `Ujobs wallet top-up for ${customer.fullName}`,
    });
    const [intent] = await db.insert(paymentIntentsTable).values({
      userId: customer.id,
      amount: parsed.data.amount,
      currency: "MAD",
      provider: "stripe",
      status: paymentIntent.status,
      externalId: paymentIntent.id,
    }).returning();
    res.status(201).json(CreateTopupResponse.parse({
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: paymentIntent.status,
      provider: intent.provider,
      clientSecret: paymentIntent.client_secret,
      publishableKey: await getStripePublishableKey(),
    }));
    return;
  }

  const [intent] = await db.insert(paymentIntentsTable).values({
    userId: customer.id,
    amount: parsed.data.amount,
    provider: providerName,
    status: "succeeded",
  }).returning();
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.providerId, provider.id)).limit(1);
  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }
  const [updatedWallet] = await db.update(walletsTable).set({ balance: wallet.balance + parsed.data.amount, updatedAt: new Date() }).where(eq(walletsTable.id, wallet.id)).returning();
  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    type: "topup",
    amount: parsed.data.amount,
    balanceAfter: updatedWallet.balance,
    description: "شحن تجريبي عبر Sandbox Payment",
    referenceId: intent.id,
  });
  res.status(201).json(CreateTopupResponse.parse({
    id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
    provider: intent.provider,
    clientSecret: null,
  }));
});

router.post("/wallet/topups/:id/confirm", async (req, res): Promise<void> => {
  await ensureSeedData();
  const [intent] = await db.select().from(paymentIntentsTable).where(eq(paymentIntentsTable.id, req.params.id)).limit(1);
  if (!intent || intent.provider !== "stripe" || !intent.externalId) {
    res.status(404).json({ error: "Stripe top-up not found" });
    return;
  }
  if (intent.status === "succeeded") {
    res.json({ status: "succeeded", amount: intent.amount });
    return;
  }

  const stripe = await getUncachableStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(intent.externalId);
  if (paymentIntent.status !== "succeeded") {
    res.status(409).json({ error: "Stripe payment is not complete", status: paymentIntent.status });
    return;
  }

  const credited = await creditSucceededStripeTopup(intent.externalId);
  res.json(credited);
});

router.get("/wallet/transactions", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const provider = await defaultProvider();
  const [wallet] = provider ? await db.select().from(walletsTable).where(eq(walletsTable.providerId, provider.id)).limit(1) : [];
  const rows = wallet ? await db.select().from(walletTransactionsTable).where(eq(walletTransactionsTable.walletId, wallet.id)).orderBy(desc(walletTransactionsTable.createdAt)) : [];
  res.json(ListWalletTransactionsResponse.parse(rows));
});

router.post("/complaints", async (req, res): Promise<void> => {
  await ensureSeedData();
  const parsed = CreateComplaintBody.safeParse(req.body);
  const customer = await defaultCustomer();
  if (!parsed.success || !customer) {
    res.status(400).json({ error: parsed.success ? "Account not available" : parsed.error.message });
    return;
  }
  const [complaint] = await db.insert(complaintsTable).values({ ...parsed.data, openedBy: customer.id }).returning();
  res.status(201).json(CreateComplaintResponse.parse(complaint));
});

router.get("/admin/overview", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const summary = await dashboardSummary();
  const recentRequests = await requestRows(5);
  const transactions = await db.select().from(walletTransactionsTable).orderBy(desc(walletTransactionsTable.createdAt)).limit(5);
  res.json(GetAdminOverviewResponse.parse({ summary, recentRequests, recentTransactions: transactions }));
});

export default router;