import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { InventoryProduct } from "@/models/StoreData";
import { departmentDirectory } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!process.env.MONGODB_URI) return NextResponse.json({products:[],message:"Live prices are not configured."},{status:503});
  try {
    await connectToDatabase();
    const items=await InventoryProduct.find({}, { _id:0,id:1,name:1,category:1,price:1,unit:1,image:1,stock:1 }).maxTimeMS(5000).lean();
    const products=items.map(item=>{
      const category=item.category.toLowerCase();
      const department=departmentDirectory.find(d=>d.title.toLowerCase()===category || d.id===category)
        || departmentDirectory.find(d=>d.id===(/gift/.test(category)?"gift-items":/print|xerox/.test(category)?"print-xerox":/transfer|aeps/.test(category)?"money-transfer":/office/.test(category)?"office-supplies":/dairy|daily|milk/.test(category)?"daily-needs":"school-supplies"))!;
      return {key:item.id,name:item.name,department:department.title,id:department.id,price:item.price,unit:item.unit,image:item.image,description:`${item.name}${item.unit ? ` - ${item.unit}` : ""}`,aliases:item.category,available:item.stock>0};
    });
    return NextResponse.json({products},{headers:{"Cache-Control":"no-store"}});
  }catch {return NextResponse.json({products:[],message:"Live prices are temporarily unavailable."},{status:503});}
}
