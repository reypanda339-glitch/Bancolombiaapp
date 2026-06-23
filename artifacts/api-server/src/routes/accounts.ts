import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, accountsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/accounts", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const rows = userId
    ? await db.select().from(accountsTable).where(eq(accountsTable.userId, userId))
    : await db.select().from(accountsTable).orderBy(accountsTable.createdAt);
  res.json(rows);
});

router.post("/accounts", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.userId) {
    res.status(400).json({ error: "id and userId are required" });
    return;
  }
  const { createdAt: _ca, ...insertData } = data;
  const [account] = await db.insert(accountsTable).values(insertData).returning();
  res.status(201).json(account);
});

router.put("/accounts/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id: _id, createdAt: _ca, ...updateData } = req.body;
  const [account] = await db.update(accountsTable).set(updateData).where(eq(accountsTable.id, id)).returning();
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(account);
});

export default router;
