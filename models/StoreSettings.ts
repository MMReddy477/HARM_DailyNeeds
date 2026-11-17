import { model, models, Schema, type Model } from "mongoose";

export type ShopSettingsRecord = {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  googleReviewLink: string;
  storeHours: string;
  taxRate: number;
  serviceRates: Record<string, number>;
};

const schema = new Schema<ShopSettingsRecord>({
  id: { type: String, required: true, unique: true, default: "primary" },
  businessName: { type: String, required: true, trim: true, maxlength: 120 },
  address: { type: String, required: true, trim: true, maxlength: 240 },
  phone: { type: String, required: true, trim: true, maxlength: 32 },
  googleReviewLink: { type: String, trim: true, maxlength: 500, default: "" },
  storeHours: { type: String, required: true, trim: true, maxlength: 120 },
  taxRate: { type: Number, min: 0, max: 100, default: 0 },
  serviceRates: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const StoreSettings = (models.StoreSettings as Model<ShopSettingsRecord> | undefined)
  || model<ShopSettingsRecord>("StoreSettings", schema);
