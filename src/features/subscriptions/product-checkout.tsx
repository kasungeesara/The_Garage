"use client";
/* Listing media uses the existing authenticated marketplace API. */
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useMarketplace } from '@/providers/marketplace-provider';
import { money } from '@/types/marketplace';
import { PaymentDemo } from './payment-demo';
type ProductQuote={id:string;slug:string;title:string;seller:string;image:string|null;amountMinor:number;currency:string;checkoutAvailable:boolean};
export function ProductCheckout({id}:{id:string}){
 const {state,ready}=useMarketplace();const [quote,setQuote]=useState<ProductQuote|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[busy,setBusy]=useState(false);
 const [demoStep,setDemoStep]=useState<'review'|'confirm'>('review');
 useEffect(()=>{setDemoStep('review');setQuote(null);setError('');},[id]);
 useEffect(()=>{if(!ready||!state.user)return;let cancelled=false;void api<ProductQuote>(`subscriptions/products/${id}`).then(value=>{if(!cancelled){setQuote(value);setError('');}}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Unable to load checkout');});return()=>{cancelled=true;};},[ready,state.user,id,retry]);
 if(!ready)return <div className="container section" role="status">Loading checkout…</div>;
 if(!state.user)return <div className="container section"><h1>Your next part is waiting.</h1><p>Sign in to review your purchase.</p><Link className="btn plan-cta" href={`/auth/login?next=/checkout/${id}`}>Sign in to continue</Link></div>;
 if(quote&&demoStep==='confirm')return <div className="plans-page payment-demo-page"><div className="container product-checkout"><PaymentDemo key={id} quote={quote} onCancel={()=>setDemoStep('review')}/></div></div>;
 return <div className="plans-page"><div className="container product-checkout"><Link className="text-button" href={quote?`/parts/${quote.slug}`:'/parts'}>← Back to part</Link><header><span className="plan-label">THE ගරාජ් · CHECKOUT</span><h1>One step closer.<br /><span>Confirm your part.</span></h1><p className="muted">A clear view of your purchase before you pay.</p></header>{error&&<div role="alert" className="plan-error"><p>{error}</p><button className="btn btn-secondary" onClick={()=>setRetry(n=>n+1)}>Retry</button></div>}{!quote&&!error&&<p role="status">Checking availability and price…</p>}{quote&&<div className="checkout-summary"><div className="checkout-item">{quote.image&&<img src={quote.image} alt={quote.title} width={90} height={90}/>}<div><span className="plan-label">YOUR NEXT PART</span><h2>{quote.title}</h2><p className="muted">Sold by {quote.seller}</p></div></div><dl><div><dt>Part price</dt><dd>{money(quote.amountMinor/100)}</dd></div><div><dt>Collection / delivery</dt><dd>Confirm with seller</dd></div><div className="checkout-total"><dt>Part total</dt><dd>{money(quote.amountMinor/100)}</dd></div></dl><p className="notice">Confirm compatibility, condition and collection or delivery arrangements with the seller before paying. Delivery charges are not included in this part price.</p>{demoStep==='review'&&<button className="btn plan-cta" disabled={busy} onClick={async()=>{
 if(!quote.checkoutAvailable){setDemoStep('confirm');setError('');return;}
 setBusy(true);try{const result=await api<{checkoutUrl:string}>(`subscriptions/products/${id}/checkout`,{});window.location.assign(result.checkoutUrl);}catch(e){setError(e instanceof Error?e.message:'Unable to open checkout');}finally{setBusy(false);}
 }}>{busy?'Opening checkout…':`${quote.checkoutAvailable?'Pay':'Preview payment'} ${money(quote.amountMinor/100)}`} <span aria-hidden="true">↗</span></button>}
 {!quote.checkoutAvailable&&<p className="plan-footnote" role="status">Demo checkout only. No money will be charged and no order will be placed.</p>}
 </div>}</div></div>;
}
