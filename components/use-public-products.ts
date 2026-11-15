"use client";
import { useEffect, useState } from "react";
import { catalogExamples, mergePublicProducts, type PublicProduct } from "@/lib/product-search";
export function usePublicProducts() {
  const [products,setProducts]=useState<PublicProduct[]>(catalogExamples);
  const [notice,setNotice]=useState("Loading saved product prices...");
  useEffect(()=>{const controller=new AbortController();fetch('/api/products',{cache:'no-store',signal:controller.signal}).then(async response=>{const result=await response.json();if(!response.ok)throw Error(result.message);setProducts(mergePublicProducts(result.products));setNotice(result.products.length ? "Prices shown are saved shop prices. Unpriced examples are labelled separately." : "No saved shop prices yet. Add products and prices in Admin.");}).catch(error=>{if(error.name!=="AbortError")setNotice("Live prices unavailable. Unpriced catalog examples are shown; contact the shop for prices.");});return()=>controller.abort();},[]);
  return {products,notice};
}
