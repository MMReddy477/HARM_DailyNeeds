import { NextResponse } from "next/server";
import { z } from "zod";
import { isOwnerAuthenticated } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ExpenseRecord, InventoryProduct, SaleRecord, TransferRecord } from "@/models/StoreData";

const product = z.object({
  id: z.string().max(80),
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
  price: z.number().finite().min(0),
  costPrice: z.number().finite().min(0).optional().default(0),
  stock: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  unit: z.string().trim().max(24),
  image: z.string().max(1400000).optional().default(""),
  brand: z.string().max(80).optional().default(""),
  description: z.string().max(500).optional().default(""),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  featured: z.boolean().optional().default(false),
  expiryDate: z.coerce.date().nullable().optional().default(null)
});
const sale = z.object({
  id: z.string().max(80),
  type: z.string().trim().min(1).max(50),
  productId: z.string().max(80).optional().default(""),
  amount: z.number().finite().min(0),
  quantity: z.number().int().min(1),
  note: z.string().max(200).optional().default(""),
  costAmount: z.number().finite().min(0).optional(),
  profit: z.number().finite().optional(),
  transactionId: z.string().max(80).optional().default(""),
  customerName: z.string().max(100).optional().default(""),
  occurredAt: z.coerce.date()
});
const transfer = z.object({
  id: z.string().max(80),
  customerName: z.string().trim().min(1).max(100),
  mobileNumber: z.string().trim().min(5).max(20),
  amount: z.number().finite().min(0),
  transactionId: z.string().trim().min(1).max(100),
  serviceCharge: z.number().finite().min(0),
  status: z.enum(["Pending", "Completed", "Failed"]),
  occurredAt: z.coerce.date()
});
const expense = z.object({
  id: z.string().max(80),
  description: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(50),
  amount: z.number().finite().positive(),
  occurredAt: z.coerce.date()
});
const payloadSchema = z.object({
  inventoryUpserts: z.array(product).max(100),
  inventoryDeleteIds: z.array(z.string().max(80)).max(100),
  salesToAdd: z.array(sale).max(100),
  transfersToAdd: z.array(transfer).max(100),
  expensesToAdd: z.array(expense).max(100).optional().default([])
});

async function authorize() {
  return isOwnerAuthenticated();
}

export async function GET() {
  if (!await authorize()) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  try {
    await connectToDatabase();
    const [inventory, sales, transfers, expenses] = await Promise.all([
      InventoryProduct.find().sort({ name: 1 }).lean(),
      SaleRecord.find().sort({ occurredAt: -1 }).lean(),
      TransferRecord.find().sort({ occurredAt: -1 }).lean(),
      ExpenseRecord.find().sort({ occurredAt: -1 }).lean()
    ]);
    return NextResponse.json({
      inventory,
      sales,
      transfers,
      expenses
    });
  } catch (error) {
    console.error("Could not load owner dashboard data:", error);
    return NextResponse.json({ message: "Database unavailable. Configure MONGODB_URI to load saved shop records." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!await authorize()) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Invalid shop data.", details: parsed.error.flatten() }, { status: 400 });
    await connectToDatabase();
    const { inventoryUpserts, inventoryDeleteIds, salesToAdd, transfersToAdd, expensesToAdd } = parsed.data;
    await Promise.all([
      inventoryUpserts.length > 0 && InventoryProduct.bulkWrite(inventoryUpserts.map((item) => ({
        replaceOne: { filter: { id: item.id }, replacement: item, upsert: true }
      })), { ordered: true }),
      inventoryDeleteIds.length > 0 && InventoryProduct.deleteMany({ id: { $in: inventoryDeleteIds } }),
      salesToAdd.length > 0 && SaleRecord.bulkWrite(salesToAdd.map((item) => ({
        replaceOne: { filter: { id: item.id }, replacement: item, upsert: true }
      })), { ordered: true }),
      transfersToAdd.length > 0 && TransferRecord.bulkWrite(transfersToAdd.map((item) => ({
        replaceOne: { filter: { id: item.id }, replacement: item, upsert: true }
      })), { ordered: true }),
      expensesToAdd.length > 0 && ExpenseRecord.bulkWrite(expensesToAdd.map((item) => ({
        replaceOne: { filter: { id: item.id }, replacement: item, upsert: true }
      })), { ordered: true })
    ]);
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Could not save owner dashboard data:", error);
    return NextResponse.json({ message: "Could not save records. Check the database connection." }, { status: 503 });
  }
}
