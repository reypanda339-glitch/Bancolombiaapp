import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cardsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/cards", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const rows = userId
    ? await db.select().from(cardsTable).where(eq(cardsTable.userId, userId))
    : await db.select().from(cardsTable).orderBy(cardsTable.createdAt);
  res.json(rows);
});

router.post("/cards", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.userId) {
    res.status(400).json({ error: "id and userId are required" });
    return;
  }
  const { createdAt: _ca, ...insertData } = data;
  const [card] = await db.insert(cardsTable).values(insertData).returning();
  res.status(201).json(card);
});

router.put("/cards/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id: _id, createdAt: _ca, ...updateData } = req.body;
  const [card] = await db.update(cardsTable).set(updateData).where(eq(cardsTable.id, id)).returning();
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  res.json(card);
});

export default router;
