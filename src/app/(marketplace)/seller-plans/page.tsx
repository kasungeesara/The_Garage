import type { Metadata } from 'next';
import { SellerPlans } from '@/features/subscriptions/plans';
export const metadata:Metadata={title:'Seller Plans | The ගරාජ්',description:'Start free with 5 listings, or give your shop room to grow with 100 listings for Rs. 2,000 per 30 days.'};
export default function Page(){return <SellerPlans />;}
