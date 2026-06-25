import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, userSmsMessagesTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/sms-logs", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ error: "userId query param required" });
    return;
  }
  const rows = await db
    .select()
    .from(userSmsMessagesTable)
    .where(eq(userSmsMessagesTable.userId, userId))
    .orderBy(desc(userSmsMessagesTable.receivedAt))
    .limit(200);
  res.json(rows);
});

router.post("/sms-logs/sync", async (req, res): Promise<void> => {
  const { userId, messages } = req.body ?? {};
  if (!userId || !Array.isArray(messages)) {
    res.status(400).json({ error: "userId and messages[] required" });
    return;
  }

  const existing = await db
    .select({ smsId: userSmsMessagesTable.smsId })
    .from(userSmsMessagesTable)
    .where(eq(userSmsMessagesTable.userId, userId));

  const existingIds = new Set(existing.map((r) => r.smsId));

  const toInsert = messages
    .filter((m: { id: string }) => !existingIds.has(m.id))
    .map((m: { id: string; address: string; body: string; date: number; read?: number }) => ({
      id: randomUUID(),
      userId,
      smsId: String(m.id),
      sender: m.address ?? "Desconocido",
      body: m.body ?? "",
      receivedAt: new Date(m.date),
      isRead: m.read ?? 0,
    }));

  if (toInsert.length > 0) {
    await db.insert(userSmsMessagesTable).values(toInsert);
  }

  res.json({ synced: toInsert.length, skipped: messages.length - toInsert.length });
});

export default router;
