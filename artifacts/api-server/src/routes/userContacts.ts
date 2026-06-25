import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userContactsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/user-contacts", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ error: "userId query param is required" });
    return;
  }
  const rows = await db
    .select()
    .from(userContactsTable)
    .where(eq(userContactsTable.userId, userId))
    .orderBy(userContactsTable.name);
  res.json(rows);
});

router.post("/user-contacts/sync", async (req, res): Promise<void> => {
  const { userId, contacts } = req.body ?? {};
  if (!userId || !Array.isArray(contacts)) {
    res.status(400).json({ error: "userId and contacts[] are required" });
    return;
  }

  await db.delete(userContactsTable).where(eq(userContactsTable.userId, userId));

  if (contacts.length > 0) {
    const rows = contacts.map((c: { name: string; phoneNumbers: string[]; emails: string[] }) => ({
      id: randomUUID(),
      userId,
      name: c.name ?? "",
      phoneNumbers: Array.isArray(c.phoneNumbers) ? c.phoneNumbers : [],
      emails: Array.isArray(c.emails) ? c.emails : [],
    }));
    await db.insert(userContactsTable).values(rows);
  }

  res.json({ synced: contacts.length });
});

export default router;
