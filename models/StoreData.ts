import { model, models, Schema, type Model } from "mongoose";

export type InventoryRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  stock: number;
  reorderLevel: number;
  unit: string;
  image: string;
  brand?: string;
  description?: string;
  status?: "Active" | "Inactive";
  featured?: boolean;
  expiryDate?: Date | null;
};

export type SaleRecordData = {
  id: string;
  type: string;
  productId: string;
  amount: number;
  quantity: number;
  note: string;
  costAmount?: number;
  profit?: number;
  transactionId?: string;
  customerName?: string;
  occurredAt: Date;
};

export type ExpenseRecordData = {
  id: string;
  description: string;
  category: string;
  amount: number;
  occurredAt: Date;
};

export type TransferRecordData = {
  id: string;
  customerName: string;
  mobileNumber: string;
  amount: number;
  transactionId: string;
  serviceCharge: number;
  status: "Pending" | "Completed" | "Failed";
  occurredAt: Date;
};

const inventorySchema = new Schema<InventoryRecord>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 50 },
  price: { type: Number, min: 0, default: 0 },
  costPrice: { type: Number, min: 0, default: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  reorderLevel: { type: Number, min: 0, default: 5 },
  unit: { type: String, trim: true, maxlength: 24, default: "piece" },
  image: { type: String, trim: true, maxlength: 1400000, default: "" },
  brand: { type: String, trim: true, maxlength: 80, default: "" },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  featured: { type: Boolean, default: false },
  expiryDate: { type: Date, default: null }
}, { timestamps: true });

const saleSchema = new Schema<SaleRecordData>({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, trim: true, maxlength: 50 },
  productId: { type: String, trim: true, default: "" },
  amount: { type: Number, required: true, min: 0 },
  quantity: { type: Number, min: 1, default: 1 },
  note: { type: String, trim: true, maxlength: 200, default: "" },
  costAmount: { type: Number, min: 0 },
  profit: { type: Number },
  transactionId: { type: String, trim: true, maxlength: 80, default: "" },
  customerName: { type: String, trim: true, maxlength: 100, default: "" },
  occurredAt: { type: Date, default: Date.now }
});

const expenseSchema = new Schema<ExpenseRecordData>({
  id: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 50 },
  amount: { type: Number, required: true, min: 0 },
  occurredAt: { type: Date, default: Date.now }
});

const transferSchema = new Schema<TransferRecordData>({
  id: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true, trim: true, maxlength: 100 },
  mobileNumber: { type: String, required: true, trim: true, maxlength: 20 },
  amount: { type: Number, required: true, min: 0 },
  transactionId: { type: String, required: true, trim: true, maxlength: 100 },
  serviceCharge: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
  occurredAt: { type: Date, default: Date.now }
});

export const InventoryProduct = (models.InventoryProduct as Model<InventoryRecord> | undefined)
  || model<InventoryRecord>("InventoryProduct", inventorySchema);
export const SaleRecord = (models.SaleRecord as Model<SaleRecordData> | undefined)
  || model<SaleRecordData>("SaleRecord", saleSchema);
export const TransferRecord = (models.TransferRecord as Model<TransferRecordData> | undefined)
  || model<TransferRecordData>("TransferRecord", transferSchema);
export const ExpenseRecord = (models.ExpenseRecord as Model<ExpenseRecordData> | undefined)
  || model<ExpenseRecordData>("ExpenseRecord", expenseSchema);
