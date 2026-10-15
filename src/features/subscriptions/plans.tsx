"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/providers/marketplace-provider';
import { ApiError, api } from '@/lib/api';

export function UpgradeButton({renew=false}:{renew?:boolean}) {
 const {state,ready}=useMarketplace();const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <div><button className="btn plan-cta" disabled={busy||!ready} onClick={async()=>{
  if(!state.user){router.push('/auth/login?next=/seller-plans');return;}
  if(!state.store.slug){router.push('/sell');return;}
  setBusy(true);setError('');
  try{const result=await api<{checkoutUrl:string}>('subscriptions/checkout',{});window.location.assign(result.checkoutUrl);}
  catch(e){setError(e instanceof ApiError && e.status===503?'Online payments are awaiting merchant gateway configuration. No charge has been made.':e instanceof Error?e.message:'Unable to start checkout. Please retry.');}
  finally{setBusy(false);}
 }}>{busy?'Opening checkout…':renew?'Renew Plan':'Upgrade Shop'}<span aria-hidden="true">↗</span></button>
 {error&&<p className="plan-error" role="alert">{error}</p>}</div>;
}
const questions=[
 ['How do I pay?', 'Sign in and select Upgrade Shop. Once merchant checkout is configured, you will pay securely on the payment gateway’s hosted page. The Shop Plan costs Rs. 2,000 for 30 days.'],
 ['When does my Shop Plan activate?', 'Only after the gateway confirms your payment to our server. A return to the site is not proof of payment. If confirmation takes time, your dashboard shows Payment processing and checks for the final result.'],
 ['How does renewal work?', 'Renew manually whenever you need another 30 days. Renewing before expiry adds 30 days to your existing expiry date. After expiry, the new period starts when payment is confirmed. No automatic charges.'],
 ['What happens when my plan expires?', 'You return to the Free Plan. Up to 5 listings stay active and the rest are paused, never deleted. Choose the five to keep in your subscription settings. If you have not chosen, we keep your oldest five active listings. Your public shop page is hidden; its details and listings are preserved for renewal.'],
 ['Can buyers contact me on the Free Plan?', 'Yes. Buyers can call or WhatsApp you from your active listings. A dedicated public shop page is included with an active Shop Plan.'],
];
export function SellerPlans(){
 const {state}=useMarketplace();
 return <div className="plans-page"><div className="container">
  <header className="plans-intro"><span className="plan-label">THE ගරාජ් · SELLER PLANS</span><h1>A little garage.<br /><span>A bigger possibility.</span></h1><p>Start with a few spare parts. Make room for your whole shop.<br />Simple plans, built for the way you sell.</p><div className="plan-pills"><span>✓ Pay in Sri Lankan rupees</span><span>✓ Renew on your terms</span></div></header>
  <div className="plan-grid">
   <article className="plan-card"><div className="plan-icon" aria-hidden="true">05</div><span className="plan-label">START SMALL</span><h2>Free Plan</h2><p className="muted">For the parts waiting for their next chapter.</p><div className="plan-price">Rs. 0<small>Free to get started</small></div><Link className="btn btn-secondary" href={state.user?(state.store.slug?'/seller':'/sell'):'/auth/register?next=/sell'}>Get Started Free <span aria-hidden="true">→</span></Link><ul><li>Up to <strong>5 active spare-parts listings</strong></li><li>Buyers can contact you by phone</li><li>Connect with buyers on WhatsApp</li></ul><p className="plan-footnote">Your parts. Your pace.</p></article>
   <article className="plan-card plan-card-shop"><div className="plan-card-top"><div className="plan-icon" aria-hidden="true">100</div><span className="plan-tag">ROOM TO GROW</span></div><span className="plan-label">YOUR SHOP, ONLINE</span><h2>Shop Plan</h2><p className="muted">A proper home for your business and your inventory.</p><div className="plan-price">Rs. 2,000<small>for 30 days</small></div><UpgradeButton /><ul><li>Up to <strong>100 active spare-parts listings</strong></li><li>Your own dedicated public shop page</li><li>Shop logo, description and location</li><li>Phone and WhatsApp contact details</li><li>All active listings in one place</li></ul><p className="plan-footnote"><strong>Valid for 30 days. Renew manually. No automatic charges.</strong></p></article>
  </div>
  <aside className="plan-expiry"><span aria-hidden="true">↻</span><div><strong>Always keep your work.</strong><p>When your Shop Plan expires, keep up to 5 listings active. Extra listings pause and your shop page is hidden. Choose which five stay active in your dashboard. Everything is saved for your next renewal.</p></div></aside>
  <section className="plan-faq" aria-labelledby="plan-faq-title"><div><span className="plan-label">GOOD TO KNOW</span><h2 id="plan-faq-title">A few things,<br />made clear.</h2><p className="muted">No hidden renewals.<br />No lost listings.</p></div><div>{questions.map(([title,body])=><details key={title}><summary>{title}</summary><p>{body}</p></details>)}</div></section>
 </div></div>;
}
