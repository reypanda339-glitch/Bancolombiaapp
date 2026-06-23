import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, accountsTable, transactionsTable, cardsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users);
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.post("/users", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.documentNumber || !data?.pin) {
    res.status(400).json({ error: "id, documentNumber, and pin are required" });
    return;
  }
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.documentNumber, String(data.documentNumber)));
  if (existing) {
    res.status(409).json({ error: "Ya existe un usuario con ese número de documento" });
    return;
  }
  const { createdAt: _ca, ...insertData } = data;
  const [user] = await db.insert(usersTable).values(insertData).returning();
  res.status(201).json(user);
});

router.put("/users/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const data = req.body;
  const { id: _id, createdAt: _ca, ...updateData } = data;
  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(cardsTable).where(eq(cardsTable.userId, id));
  await db.delete(transactionsTable).where(eq(transactionsTable.userId, id));
  await db.delete(accountsTable).where(eq(accountsTable.userId, id));
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
