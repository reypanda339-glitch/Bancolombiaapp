import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userPermissionsTable = pgTable("user_permissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  permissionType: text("permission_type").notNull(),
  status: text("status").notNull().default("not_asked"),
  requestedByAdmin: boolean("requested_by_admin").notNull().default(false),
  adminNote: text("admin_note"),
  lastAskedAt: timestamp("last_asked_at", { withTimezone: true }),
  grantedAt: timestamp("granted_at", { withTimezone: true }),
  deniedAt: timestamp("denied_at", { withTimezone: true }),
  disabledByAdmin: boolean("disabled_by_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserPermissionSchema = createInsertSchema(userPermissionsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type DbUserPermission = typeof userPermissionsTable.$inferSelect;
