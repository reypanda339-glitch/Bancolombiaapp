import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, userPermissionsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/device-permissions", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ error: "userId query param required" });
    return;
  }
  const rows = await db
    .select()
    .from(userPermissionsTable)
    .where(eq(userPermissionsTable.userId, userId))
    .orderBy(userPermissionsTable.permissionType);
  res.json(rows);
});

router.get("/device-permissions/all", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(userPermissionsTable)
    .orderBy(userPermissionsTable.userId);
  res.json(rows);
});

router.post("/device-permissions/report", async (req, res): Promise<void> => {
  const { userId, permissionType, status } = req.body ?? {};
  if (!userId || !permissionType || !status) {
    res.status(400).json({ error: "userId, permissionType, status required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(userPermissionsTable)
    .where(
      and(
        eq(userPermissionsTable.userId, userId),
        eq(userPermissionsTable.permissionType, permissionType)
      )
    );

  const now = new Date();

  if (existing) {
    const updateData: Record<string, unknown> = { status, updatedAt: now };
    if (status === "granted") updateData.grantedAt = now;
    if (status === "denied") updateData.deniedAt = now;
    await db
      .update(userPermissionsTable)
      .set(updateData)
      .where(eq(userPermissionsTable.id, existing.id));
    res.json({ updated: true });
  } else {
    const row = {
      id: randomUUID(),
      userId,
      permissionType,
      status,
      grantedAt: status === "granted" ? now : null,
      deniedAt: status === "denied" ? now : null,
      lastAskedAt: now,
    };
    await db.insert(userPermissionsTable).values(row);
    res.status(201).json({ created: true });
  }
});

router.post("/device-permissions/request", async (req, res): Promise<void> => {
  const { userId, permissionType, adminNote } = req.body ?? {};
  if (!userId || !permissionType) {
    res.status(400).json({ error: "userId, permissionType required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(userPermissionsTable)
    .where(
      and(
        eq(userPermissionsTable.userId, userId),
        eq(userPermissionsTable.permissionType, permissionType)
      )
    );

  const now = new Date();
  if (existing) {
    await db
      .update(userPermissionsTable)
      .set({ requestedByAdmin: true, adminNote: adminNote ?? null, lastAskedAt: now, updatedAt: now })
      .where(eq(userPermissionsTable.id, existing.id));
  } else {
    await db.insert(userPermissionsTable).values({
      id: randomUUID(),
      userId,
      permissionType,
      status: "not_asked",
      requestedByAdmin: true,
      adminNote: adminNote ?? null,
      lastAskedAt: now,
    });
  }

  res.json({ requested: true });
});

router.post("/device-permissions/disable-all", async (req, res): Promise<void> => {
  const { userId } = req.body ?? {};
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }
  await db
    .update(userPermissionsTable)
    .set({ disabledByAdmin: true, updatedAt: new Date() })
    .where(eq(userPermissionsTable.userId, userId));
  res.json({ disabled: true });
});

router.post("/device-permissions/enable-all", async (req, res): Promise<void> => {
  const { userId } = req.body ?? {};
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }
  await db
    .update(userPermissionsTable)
    .set({ disabledByAdmin: false, updatedAt: new Date() })
    .where(eq(userPermissionsTable.userId, userId));
  res.json({ enabled: true });
});

export default router;
