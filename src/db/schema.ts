import { pgTable, uuid, text, timestamp, jsonb, numeric, date, boolean } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  tags: text("tags").array(),
  notes: text("notes"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(),
  priority: text("priority").default("medium").notNull(),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  spent: numeric("spent", { precision: 12, scale: 2 }).default("0"),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo").notNull(),
  priority: text("priority").default("medium").notNull(),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").notNull(),
  status: text("status").default("draft").notNull(),
  issueDate: date("issue_date").defaultNow().notNull(),
  dueDate: date("due_date"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("USD").notNull(),
  notes: text("notes"),
  items: jsonb("items").default([]),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  direction: text("direction").notNull(),
  messageType: text("message_type").default("text").notNull(),
  content: text("content").notNull(),
  waMessageId: text("wa_message_id"),
  status: text("status").default("sent").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portalTokens = pgTable("portal_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  tokensUsed: text("tokens_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
