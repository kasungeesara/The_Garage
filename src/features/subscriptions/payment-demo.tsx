"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { money } from '@/types/marketplace';

type Quote = { title: string; seller: string; slug: string; amountMinor: number };
export function PaymentDemo({ quote, onCancel }: { quote: Quote; onCancel: () => void }) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'complete' | 'receipt'>('confirm');
  const [printKey, setPrintKey] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    if (step !== 'processing') return;
    const timer = window.setTimeout(() => setStep('complete'), 2600);
    return () => window.clearTimeout(timer);
  }, [step]);
  const amount = money(quote.amountMinor / 100);
  return <section className={`pay-experience pay-${step}`} aria-label="Demo payment checkout">
    <div className="pay-topline"><button className="text-button" onClick={step === 'receipt' ? () => setStep('complete') : onCancel} disabled={step === 'processing'} aria-label="Go back">←</button><span>THE ගරාජ්</span><span className="pay-demo-badge">DEMO</span></div>
    {step === 'receipt' ? <>
      <h2 ref={heading} tabIndex={-1} className="pay-receipt-heading">Your receipt.</h2>
      <p className="pay-caption">A little keepsake of your preview.</p>
      <div className="pay-printer" key={printKey}>
        <div className="pay-printer-body"><span className="pay-printer-light"/><div className="pay-printer-slot"/></div>
        <div className="pay-paper-window"><article className="pay-paper">
          <div className="pay-paper-brand">THE ගරාජ්</div><p className="pay-paper-subtitle">DEMO PAYMENT RECEIPT</p>
          <dl><div><dt>Part</dt><dd>{quote.title}</dd></div><div><dt>Seller</dt><dd>{quote.seller}</dd></div><div><dt>Currency</dt><dd>LKR</dd></div></dl>
          <dl><div><dt>Preview total</dt><dd>{amount}</dd></div><div className="pay-paper-total"><dt>Charged</dt><dd>{money(0)}</dd></div></dl>
          <span className="pay-demo-stamp">DEMO ONLY</span><p>No money charged.<br/>No order placed or part reserved.</p>
          <div className="pay-barcode" aria-hidden="true"/><p className="pay-paper-thanks">Thank you for choosing The ගරාජ්.</p>
        </article></div>
      </div>
      <div className="pay-actions"><button className="btn pay-outline" onClick={() => setPrintKey(k => k + 1)}>↻ Replay print</button><button className="btn pay-light" onClick={onCancel}>Done</button></div>
    </> : <>
      <h2 ref={heading} tabIndex={-1}>{step === 'complete' ? 'All set.' : step === 'processing' ? 'One moment.' : 'Confirm your payment.'}</h2>
      <p className="pay-caption">{step === 'complete' ? 'Your demo is complete. Your next part is one step closer.' : step === 'processing' ? 'Playing your payment preview…' : 'A clear view before you continue.'}</p>
      {step === 'confirm' ? <div className="pay-gold-card"><span className="pay-card-chip"/><span className="pay-contactless" aria-hidden="true">)))</span><span className="pay-card-label">THE ගරාජ්<span>PAYMENT PREVIEW</span></span><strong>{amount}</strong></div> : <div className={`pay-terminal-scene ${step === 'complete' ? 'is-complete' : ''}`} aria-hidden="true">
        <div className="pay-tap-card"><span className="pay-card-chip"/><strong>THE ගරාජ්</strong></div>
        <div className="pay-terminal"><div className="pay-terminal-slip"/><div className="pay-terminal-screen"><svg viewBox="0 0 60 60"><path d="M14 31l11 11 22-24"/></svg></div><div className="pay-terminal-keys">{Array.from({length:12},(_,i)=><i key={i}/>)}</div><div className="pay-terminal-bottom"><i/><i/><i/></div></div>
        <div className="pay-terminal-shadow"/>
      </div>}
      <dl className="pay-details"><div><dt>Part</dt><dd>{quote.title}</dd></div><div><dt>Seller</dt><dd>{quote.seller}</dd></div><div><dt>Preview total</dt><dd>{amount}</dd></div><div><dt>Actual charge</dt><dd>{money(0)}</dd></div></dl>
      <p className="pay-disclosure">Demo only · No money charged, no order placed.</p>
      {step === 'complete' ? <div className="pay-complete-actions"><button className="btn pay-secondary" onClick={() => setStep('receipt')}>View receipt ↗</button><Link className="btn pay-primary" href={`/parts/${quote.slug}#enquire`}>Contact seller</Link><button className="text-button" onClick={onCancel}>Back to review</button></div> : <button className={`btn pay-primary ${step === 'processing' ? 'pay-busy' : ''}`} disabled={step === 'processing'} onClick={() => setStep('processing')}>{step === 'processing' ? <><span className="pay-loading-dots" aria-hidden="true"><i/><i/><i/></span><span className="sr-only">Playing payment animation</span></> : <>Confirm demo payment <span>↗</span></>}</button>}
      <p className="sr-only" role="status">{step === 'processing' ? 'Demo payment animation in progress.' : step === 'complete' ? 'Demo complete. No money was charged.' : ''}</p>
    </>}
  </section>;
}
