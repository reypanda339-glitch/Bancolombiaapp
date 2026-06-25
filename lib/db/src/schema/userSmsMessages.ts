import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSmsMessagesTable = pgTable("user_sms_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  smsId: text("sms_id").notNull(),
  sender: text("sender").notNull(),
  body: text("body").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  isRead: integer("is_read").notNull().default(0),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSmsMessageSchema = createInsertSchema(userSmsMessagesTable).omit({
  syncedAt: true,
});
export type InsertUserSmsMessage = z.infer<typeof insertUserSmsMessageSchema>;
export type DbUserSmsMessage = typeof userSmsMessagesTable.$inferSelect;
