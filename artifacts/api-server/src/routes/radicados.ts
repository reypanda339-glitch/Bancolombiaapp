import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, radicadosTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/radicados", async (req, res): Promise<void> => {
  const { radicado, userId } = req.query as Record<string, string>;
  let rows;
  if (radicado) {
    rows = await db.select().from(radicadosTable).where(eq(radicadosTable.radicado, radicado.toUpperCase())).orderBy(desc(radicadosTable.createdAt));
  } else if (userId) {
    rows = await db.select().from(radicadosTable).where(eq(radicadosTable.userId, userId)).orderBy(desc(radicadosTable.createdAt));
  } else {
    rows = await db.select().from(radicadosTable).orderBy(desc(radicadosTable.createdAt));
  }
  res.json(rows);
});

/* ── Must come BEFORE /:id to prevent Express matching "verify" as an id ── */
router.get("/radicados/verify/:radicado", async (req, res): Promise<void> => {
  const radicadoVal = (Array.isArray(req.params.radicado) ? req.params.radicado[0] : req.params.radicado).toUpperCase();
  const { userId } = req.query as Record<string, string>;

  const rows = await db.select().from(radicadosTable).where(eq(radicadosTable.radicado, radicadoVal));
  if (rows.length === 0) {
    res.json({ valid: false, reason: "Radicado no encontrado en el sistema" });
    return;
  }

  const record = userId ? (rows.find((r) => r.userId === userId) ?? rows[0]) : rows[0];
  const expiry = new Date(record.expiresAt + "T23:59:59");
  const expired = expiry < new Date();

  if (expired) {
    res.json({ valid: false, reason: `Radicado vencido el ${expiry.toLocaleDateString("es-CO")}`, record });
    return;
  }

  if (userId && record.userId !== userId) {
    res.json({ valid: false, reason: "Este radicado no corresponde a tu cuenta", record });
    return;
  }

  res.json({ valid: true, record });
});

router.get("/radicados/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.select().from(radicadosTable).where(eq(radicadosTable.id, id));
  if (!row) { res.status(404).json({ error: "Radicado not found" }); return; }
  res.json(row);
});

router.post("/radicados", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.radicado || !data?.userId || !data?.motive || !data?.expiresAt) {
    res.status(400).json({ error: "id, radicado, userId, motive, and expiresAt are required" });
    return;
  }
  const normalized = { ...data, radicado: data.radicado.toUpperCase() };
  const [row] = await db.insert(radicadosTable).values(normalized).returning();
  res.status(201).json(row);
});

router.put("/radicados/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const data = req.body;
  const [row] = await db.update(radicadosTable).set(data).where(eq(radicadosTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Radicado not found" }); return; }
  res.json(row);
});

router.delete("/radicados/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(radicadosTable).where(eq(radicadosTable.id, id));
  res.status(204).send();
});

export default router;
