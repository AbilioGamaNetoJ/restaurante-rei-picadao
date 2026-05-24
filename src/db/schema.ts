import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  time,
  pgEnum,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const categoryTypeEnum = pgEnum('category_type', ['produto', 'adicional']);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'cancelled',
]);

// Categories
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: categoryTypeEnum('type').notNull().default('produto'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(productCategories),
}));

// Products
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
  imageUrl: text('image_url'),
  servesPeople: integer('serves_people'),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }),
  isAvailable: boolean('is_available').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  categories: many(productCategories),
  addons: many(productAddons),
}));

// Addons
export const addons = pgTable('addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').notNull().default(true),
});

export const addonsRelations = relations(addons, ({ one, many }) => ({
  category: one(categories, {
    fields: [addons.categoryId],
    references: [categories.id],
  }),
  products: many(productAddons),
}));

// Product Addons (Many-to-Many)
export const productAddons = pgTable('product_addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  addonId: uuid('addon_id')
    .notNull()
    .references(() => addons.id, { onDelete: 'cascade' }),
});

export const productAddonsRelations = relations(productAddons, ({ one }) => ({
  product: one(products, {
    fields: [productAddons.productId],
    references: [products.id],
  }),
  addon: one(addons, {
    fields: [productAddons.addonId],
    references: [addons.id],
  }),
}));

// Product Categories (Many-to-Many)
export const productCategories = pgTable('product_categories', {
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.productId, t.categoryId] }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  addressStreet: text('address_street').notNull(),
  addressNumber: text('address_number').notNull(),
  addressComplement: text('address_complement'),
  addressNeighborhood: text('address_neighborhood').notNull(),
  addressCity: text('address_city').notNull(),
  addressState: text('address_state').notNull(),
  addressZip: text('address_zip').notNull(),
  distanceKm: numeric('distance_km', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  paymentId: text('payment_id'),
  paymentMethod: text('payment_method'),
  paymentStatus: text('payment_status'),
  asaasCheckoutUrl: text('asaas_checkout_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

// Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  productPrice: numeric('product_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  comment: text('comment'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  addons: many(orderItemAddons),
}));

// Order Item Addons
export const orderItemAddons = pgTable('order_item_addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id')
    .notNull()
    .references(() => orderItems.id, { onDelete: 'cascade' }),
  addonId: uuid('addon_id').references(() => addons.id, { onDelete: 'set null' }),
  addonName: text('addon_name').notNull(),
  addonPrice: numeric('addon_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  imageUrl: text('image_url'),
});

export const orderItemAddonsRelations = relations(orderItemAddons, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemAddons.orderItemId],
    references: [orderItems.id],
  }),
}));

// Store Settings
export const storeSettings = pgTable('store_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  lat: numeric('lat', { precision: 10, scale: 8 }),
  lng: numeric('lng', { precision: 10, scale: 8 }),
  deliveryRadiusKm: numeric('delivery_radius_km', { precision: 10, scale: 2 }).notNull().default('10'),
  minOrder: numeric('min_order', { precision: 10, scale: 2 }).notNull().default('45.00'),
  deliveryFeeKm: numeric('delivery_fee_km', { precision: 10, scale: 2 }).notNull().default('1.50'),
  phone: text('phone'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
});

export const storeSettingsRelations = relations(storeSettings, ({ many }) => ({
  hours: many(storeHours),
}));

// Store Hours
export const storeHours = pgTable('store_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => storeSettings.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime: time('open_time').notNull(),
  closeTime: time('close_time').notNull(),
});

export const storeHoursRelations = relations(storeHours, ({ one }) => ({
  store: one(storeSettings, {
    fields: [storeHours.storeId],
    references: [storeSettings.id],
  }),
}));

// Saved Addresses
export const savedAddresses = pgTable('saved_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerEmail: text('customer_email').notNull(),
  label: text('label').notNull(),
  addressStreet: text('address_street').notNull(),
  addressNumber: text('address_number').notNull(),
  addressComplement: text('address_complement'),
  addressNeighborhood: text('address_neighborhood').notNull(),
  addressCity: text('address_city').notNull(),
  addressState: text('address_state').notNull(),
  addressZip: text('address_zip').notNull(),
  lat: numeric('lat', { precision: 10, scale: 8 }),
  lng: numeric('lng', { precision: 10, scale: 8 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users (Mirror from Clerk)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name'),
  email: text('email').notNull(),
  role: text('role').notNull().default('cliente'),
  salary: numeric('salary', { precision: 10, scale: 2 }),
  position: text('position'),
  department: text('department'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
}));

