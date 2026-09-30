import { and, eq } from "drizzle-orm";
import {
  db,
  paymentIntentsTable,
  providersTable,
  walletTransactionsTable,
  walletsTable,
} from "@workspace/db";

export async function creditSucceededStripeTopup(externalId: string): Promise<{ status: string; amount: number }> {
  const [intent] = await db
    .select()
    .from(paymentIntentsTable)
    .where(eq(paymentIntentsTable.externalId, externalId))
    .limit(1);

  if (!intent) {
    throw new Error("Stripe top-up not found");
  }
  if (intent.status === "succeeded") {
    return { status: "succeeded", amount: intent.amount };
  }

  const [provider] = await db.select().from(providersTable).limit(1);
  if (!provider) {
    throw new Error("No provider account available");
  }

  await db.transaction(async (tx) => {
    const [claimed] = await tx.update(paymentIntentsTable)
      .set({ status: "succeeded", updatedAt: new Date() })
      .where(and(eq(paymentIntentsTable.id, intent.id), eq(paymentIntentsTable.status, intent.status)))
      .returning();
    if (!claimed) return;
    const [wallet] = await tx.select().from(walletsTable).where(eq(walletsTable.providerId, provider.id)).limit(1);
    if (!wallet) throw new Error("Wallet not found");
    const [updatedWallet] = await tx.update(walletsTable)
      .set({ balance: wallet.balance + intent.amount, updatedAt: new Date() })
      .where(eq(walletsTable.id, wallet.id))
      .returning();
    await tx.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "topup",
      amount: intent.amount,
      balanceAfter: updatedWallet.balance,
      description: "شحن المحفظة عبر Stripe",
      referenceId: intent.externalId,
    });
  });

  return { status: "succeeded", amount: intent.amount };
}
