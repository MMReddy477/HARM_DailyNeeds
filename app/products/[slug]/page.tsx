import { notFound } from "next/navigation";
import { ShopCatalog } from "@/components/shop-catalog";
import { schoolSubcategory } from "@/lib/school-navigation";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({params}:Props){const item=schoolSubcategory((await params).slug);return {title:item?`${item.name} | H.A.R.M DAILY NEEDS`:"Product collection not found"};}
export default async function ProductCollectionPage({params}:Props){const item=schoolSubcategory((await params).slug);if(!item)notFound();return <ShopCatalog productName={item.name}/>;}
