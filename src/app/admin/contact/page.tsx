"use client";
import {useMarketplace} from '@/providers/marketplace-provider';
import {api} from '@/lib/api';
import {PageHeading,Panel,Badge,EmptyState} from '@/components/ui/kit';
export default function ContactInbox(){
 const {state,refresh,toast}=useMarketplace();
 return <><PageHeading title="Support inbox" description="Messages sent through the contact form."/>
 {state.contacts.map(item=><Panel key={item.id} title={item.topic} action={<Badge>{item.status}</Badge>}><p><strong>{item.name}</strong> · {item.email}</p><p className="muted" style={{whiteSpace:'pre-wrap',margin:'16px 0'}}>{item.message}</p><button className="btn btn-secondary" onClick={async()=>{try{await api('commands',{action:'admin.contact',data:{id:item.id,status:item.status==='Open'?'Resolved':'Open'}});await refresh();toast('Support request updated');}catch(e){toast(e instanceof Error?e.message:'Unable to update request');}}}>{item.status==='Open'?'Mark resolved':'Reopen'}</button></Panel>)}
 {!state.contacts.length&&<EmptyState title="No support messages" description="New contact submissions will appear here."/>}</>;
}
