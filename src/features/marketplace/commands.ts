import type {MarketplaceState} from '@/providers/marketplace-provider';
type Command={action:string;data:unknown};
const changed=(a:unknown,b:unknown)=>JSON.stringify(a)!==JSON.stringify(b);
// Translate UI edits into explicit server commands. The server owns authorization,
// identity, workflow transitions, timestamps, notifications and audit records.
export function commandsForUpdate(before:MarketplaceState,after:MarketplaceState):Command[]{
 const commands:Command[]=[];const add=(action:string,data:unknown)=>commands.push({action,data});
 const note=after.audit.find(a=>!before.audit.some(b=>a.id===b.id))?.action.split(' — ').slice(1).join(' — ')??'';
 const admin=before.user?.role==='Admin' && window.location.pathname.startsWith('/admin');
 if(changed(before.user,after.user)&&after.user)add('profile.save',after.user);
 if(changed(before.preferences,after.preferences))add('preferences.save',after.preferences);
 const storeChanged=changed(before.store,after.store);
 if(storeChanged)add('store.save',after.store);
 for(const p of after.parts){const old=before.parts.find(x=>x.id===p.id);if(!changed(old,p))continue;
  if(admin){if(old?.featured!==p.featured)add('admin.feature',{id:p.id,featured:p.featured});if(old?.status!==p.status)add('admin.listing',{id:p.id,status:p.status,note});}
  else if(!old||Object.keys(p).some(k=>!['status','featured','views'].includes(k)&&changed(old[k as keyof typeof old],p[k as keyof typeof p])))add('listing.save',p);
  else add('listing.status',{id:p.id,status:p.status});
 }
 const removed=before.parts.filter(p=>!after.parts.some(x=>x.id===p.id));
 for(const p of removed)add('listing.delete',{id:p.id});
 for(const id of new Set([...before.favourites,...after.favourites]))if(before.favourites.includes(id)!==after.favourites.includes(id)&&!removed.some(p=>p.id===id))add('favourite.set',{id,saved:after.favourites.includes(id)});
 if(changed(before.recent,after.recent)&&!removed.length){if(!after.recent.length)add('recent.clear',{});else add('recent.add',{id:after.recent[0]});}
 for(const e of after.enquiries){const old=before.enquiries.find(x=>x.id===e.id);if(!old)add('enquiry.create',{id:e.id,partId:e.partId,text:e.messages[0]?.text});else if(e.messages.length>old.messages.length)add('enquiry.reply',{id:e.id,text:e.messages.at(-1)?.text});else if(old.status!==e.status)add('enquiry.status',{id:e.id,status:e.status});}
 for(const r of after.reviews){const old=before.reviews.find(x=>x.id===r.id);if(!old)add('review.create',r);else if(old.reply!==r.reply)add('review.reply',{id:r.id,reply:r.reply});}
 for(const n of after.notifications){const old=before.notifications.find(x=>x.id===n.id);if(old&&old.read!==n.read)add('notification.read',{id:n.id,read:n.read});}
 for(const r of after.reports){const old=before.reports.find(x=>x.id===r.id);if(!old)add('report.create',r);else if(old.status!==r.status)add('admin.report',{id:r.id,status:r.status,note});}
 for(const u of after.users){const old=before.users.find(x=>x.id===u.id);if(old&&old.status!==u.status)add('admin.user',{id:u.id,status:u.status});}
 for(const v of after.verifications){const old=before.verifications.find(x=>x.id===v.id);if(admin&&old&&old.status!==v.status)add('admin.verification',{id:v.id,status:v.status,note});else if(!admin&&!storeChanged&&(!old||old.status!==v.status))add('verification.request',{});}
 for(const a of after.articles){const old=before.articles.find(x=>x.id===a.id);if(changed(old,a))add('admin.article.save',a);}
 for(const a of before.articles)if(!after.articles.some(x=>x.id===a.id))add('admin.article.delete',{id:a.id});
 for(const [kind,items] of Object.entries(after.references))if(changed(before.references[kind],items))add('admin.references',{kind,items});
 return commands;
}
