import { notFound } from "next/navigation";
import { ShopCatalog } from "@/components/shop-catalog";
import { schoolCategory } from "@/lib/school-navigation";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({params}:Props){const group=schoolCategory((await params).slug);return {title:group?`${group.title} | H.A.R.M DAILY NEEDS`:"Category not found"};}
export default async function CategoryPage({params}:Props){const group=schoolCategory((await params).slug);if(!group)notFound();return <ShopCatalog categoryTitle={group.title}/>;}
