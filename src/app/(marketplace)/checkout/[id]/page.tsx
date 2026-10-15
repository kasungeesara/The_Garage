import { ProductCheckout } from '@/features/subscriptions/product-checkout';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProductCheckout id={id}/>;}
