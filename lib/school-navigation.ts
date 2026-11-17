import { stationeryGroups } from "@/lib/catalog";
export function navigationSlug(value: string) { return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export const schoolCategories = stationeryGroups.map(group => ({ ...group, slug: navigationSlug(group.title) }));
export function schoolCategory(slug: string) { return schoolCategories.find(group => group.slug === slug); }
export function schoolSubcategory(slug: string) { for (const group of schoolCategories) { const name=group.items.find(item=>navigationSlug(item)===slug); if(name)return { name, group }; } return undefined; }
