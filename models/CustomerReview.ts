import { Schema, model, models, type Model } from "mongoose";

export type CustomerReviewData = { id: string; name: string; rating: number; text: string; status: "pending" | "approved" | "rejected"; clientHash: string; createdAt: Date };
const schema = new Schema<CustomerReviewData>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, maxlength: 80 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, maxlength: 1500 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  clientHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
});
schema.index({ clientHash: 1, createdAt: -1 });
export const CustomerReview = (models.CustomerReview as Model<CustomerReviewData>) || model<CustomerReviewData>("CustomerReview", schema);
