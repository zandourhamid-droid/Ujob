import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const id = () => uuid("id").defaultRandom().primaryKey();
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const usersTable = pgTable("users", {
  id: id(),
  phone: text("phone").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("customer"),
  locale: text("locale").notNull().default("ar"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const providersTable = pgTable("providers", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  businessName: text("business_name").notNull(),
  bio: text("bio"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  rating: doublePrecision("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  movementRadiusKm: integer("movement_radius_km").notNull().default(10),
  ...timestamps,
});

export const providerDocumentsTable = pgTable("provider_documents", {
  id: id(),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  documentType: text("document_type").notNull(),
  storagePath: text("storage_path").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
});

export const sectorsTable = pgTable("sectors", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const categoriesTable = pgTable("categories", {
  id: id(),
  sectorId: uuid("sector_id").notNull().references(() => sectorsTable.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const servicesTable = pgTable("services", {
  id: id(),
  categoryId: uuid("category_id").notNull().references(() => categoriesTable.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const citiesTable = pgTable("cities", {
  id: id(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const neighborhoodsTable = pgTable("neighborhoods", {
  id: id(),
  cityId: uuid("city_id").notNull().references(() => citiesTable.id),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const providerServicesTable = pgTable("provider_services", {
  id: id(),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  serviceId: uuid("service_id").notNull().references(() => servicesTable.id),
  cityId: uuid("city_id").notNull().references(() => citiesTable.id),
  priceFrom: doublePrecision("price_from"),
  priceTo: doublePrecision("price_to"),
  ...timestamps,
});

export const serviceRequestsTable = pgTable("service_requests", {
  id: id(),
  customerId: uuid("customer_id").notNull().references(() => usersTable.id),
  serviceId: uuid("service_id").notNull().references(() => servicesTable.id),
  cityId: uuid("city_id").notNull().references(() => citiesTable.id),
  neighborhoodId: uuid("neighborhood_id").notNull().references(() => neighborhoodsTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budgetMin: doublePrecision("budget_min"),
  budgetMax: doublePrecision("budget_max"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  urgent: boolean("urgent").notNull().default(false),
  images: text("images").array().notNull().default([]),
  status: text("status").notNull().default("open"),
  ...timestamps,
});

export const offersTable = pgTable("offers", {
  id: id(),
  requestId: uuid("request_id").notNull().references(() => serviceRequestsTable.id),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  amount: doublePrecision("amount").notNull(),
  message: text("message").notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  commission: doublePrecision("commission").notNull(),
  status: text("status").notNull().default("pending"),
  ...timestamps,
});

export const bookingsTable = pgTable("bookings", {
  id: id(),
  requestId: uuid("request_id").notNull().references(() => serviceRequestsTable.id),
  offerId: uuid("offer_id").notNull().references(() => offersTable.id),
  customerId: uuid("customer_id").notNull().references(() => usersTable.id),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  status: text("status").notNull().default("confirmed"),
  commission: doublePrecision("commission").notNull(),
  ...timestamps,
});

export const reviewsTable = pgTable("reviews", {
  id: id(),
  bookingId: uuid("booking_id").notNull().references(() => bookingsTable.id),
  customerId: uuid("customer_id").notNull().references(() => usersTable.id),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  ...timestamps,
});

export const walletsTable = pgTable("wallets", {
  id: id(),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  balance: doublePrecision("balance").notNull().default(0),
  currency: text("currency").notNull().default("MAD"),
  status: text("status").notNull().default("active"),
  ...timestamps,
});

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: id(),
  walletId: uuid("wallet_id").notNull().references(() => walletsTable.id),
  type: text("type").notNull(),
  amount: doublePrecision("amount").notNull(),
  balanceAfter: doublePrecision("balance_after").notNull(),
  description: text("description").notNull(),
  referenceId: text("reference_id"),
  ...timestamps,
});

export const commissionsTable = pgTable("commissions", {
  id: id(),
  bookingId: uuid("booking_id").notNull().references(() => bookingsTable.id),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  amount: doublePrecision("amount").notNull(),
  rate: doublePrecision("rate").notNull().default(0.1),
  status: text("status").notNull().default("charged"),
  ...timestamps,
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: id(),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  ...timestamps,
});

export const paymentIntentsTable = pgTable("payment_intents", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("MAD"),
  provider: text("provider").notNull().default("sandbox"),
  status: text("status").notNull().default("pending"),
  externalId: text("external_id"),
  ...timestamps,
});

export const complaintsTable = pgTable("complaints", {
  id: id(),
  requestId: uuid("request_id").references(() => serviceRequestsTable.id),
  openedBy: uuid("opened_by").notNull().references(() => usersTable.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  ...timestamps,
});

export const adminUsersTable = pgTable("admin_users", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  role: text("role").notNull().default("admin"),
  passwordHash: text("password_hash"),
  ...timestamps,
});

export const auditLogsTable = pgTable("audit_logs", {
  id: id(),
  actorId: uuid("actor_id").references(() => usersTable.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: text("metadata"),
  ...timestamps,
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;