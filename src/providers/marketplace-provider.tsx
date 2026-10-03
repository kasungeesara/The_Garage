"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import type {Part,Article,Enquiry,Review} from "@/types/marketplace";
import type {AuthUser} from "@/features/auth/api";
import {api,ApiError} from "@/lib/api";
import {commandsForUpdate} from "@/features/marketplace/commands";
export type MarketplaceState = {
  user: AuthUser | null;
  parts: Part[];
  articles: Article[];
  favourites: string[];
  recent: string[];
  enquiries: Enquiry[];
  reviews: Review[];
  notifications: { id: string; text: string; read: boolean }[];
  reports: { id: string; partId?: string; subject: string; reason: string; status: string }[];
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  }[];
  verifications: { id: string; name: string; city: string; status: string; reference?: string; note?: string }[];
  audit: { id: string; action: string; time: string }[];
  references: Record<string, string[]>;
  store: { slug?: string; reference?: string; name: string; city: string; description: string; type: string };
  preferences: { email: boolean; enquiries: boolean };
  verifiedEmail: boolean;
  sellers: {slug:string;name:string;city:string;description:string;verified:boolean;initials:string;since:string;rating:string}[];
  analytics: {day:string;views:number}[];
  contacts: {id:string;name:string;email:string;topic:string;message:string;status:string;time:string}[];
};

const initial:MarketplaceState={user:null,parts:[],articles:[],favourites:[],recent:[],enquiries:[],reviews:[],notifications:[],reports:[],users:[],verifications:[],audit:[],references:{Categories:[],Brands:[],Models:[],Locations:[]},store:{slug:"",name:"",city:"Colombo",description:"",type:"Business",reference:""},preferences:{email:false,enquiries:true},verifiedEmail:false,sellers:[],analytics:[],contacts:[]};
type Context={state:MarketplaceState;ready:boolean;busy:boolean;update:(fn:(s:MarketplaceState)=>MarketplaceState)=>Promise<boolean>;refresh:()=>Promise<void>;toast:(message:string)=>void;logout:()=>Promise<boolean>};
const MarketplaceContext=createContext<Context|null>(null);
export function MarketplaceProvider({children}:{children:ReactNode}){
 const [state,setState]=useState(initial),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const current=useRef(initial),locked=useRef(false),revision=useRef(0);
 const refresh=useCallback(async()=>{const version=++revision.current;const next=await api<MarketplaceState>('state');if(version===revision.current){current.current=next;setState(next);setReady(true);setError("");}},[]);
 useEffect(()=>{const load=()=>{if(!locked.current)void refresh().catch(()=>setError('Unable to load the marketplace. Check your connection and retry.'));};load();window.addEventListener('focus',load);const timer=setInterval(load,60000);return()=>{window.removeEventListener('focus',load);clearInterval(timer);};},[refresh]);
 useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(""),5000);return()=>clearTimeout(timer);},[message]);
 const update=useCallback(async(fn:(s:MarketplaceState)=>MarketplaceState)=>{
  if(locked.current){setMessage('Please wait for the current request.');return false;}
  if(!current.current.user){setMessage('Please sign in to continue.');return false;}
  locked.current=true;setBusy(true);revision.current++;
  try{const before=current.current;const commands=commandsForUpdate(before,fn(before));for(const command of commands)await api('commands',command);await refresh();return true;}
  catch(e){setMessage(e instanceof Error?e.message:'Unable to save changes.');if(e instanceof ApiError&&e.status===401){current.current=initial;setState(initial);}return false;}
  finally{locked.current=false;setBusy(false);}
 },[refresh]);
 const logout=useCallback(async()=>{try{await api('auth/logout',{});current.current=initial;setState(initial);await refresh();return true;}catch(e){setMessage(e instanceof Error?e.message:'Unable to sign out');return false;}},[refresh]);
 return <MarketplaceContext.Provider value={{state,ready,busy,update,refresh,toast:setMessage,logout}}>
 {error&&<div className="container section" role="alert"><p>{error}</p><button className="btn btn-primary" onClick={()=>void refresh().catch(()=>setError('Service unavailable. Please retry.'))}>Retry</button></div>}
 {children}
 {busy&&<div className="hub-toast" role="status">Saving…</div>}
 {message&&<div role="status" className="hub-toast">{message}<button aria-label="Dismiss notification" onClick={()=>setMessage("")}>×</button></div>}
 </MarketplaceContext.Provider>;
}
export function useMarketplace(){const value=useContext(MarketplaceContext);if(!value)throw new Error('MarketplaceProvider required');return value;}
export function auditEntry(action:string){return {id:crypto.randomUUID(),action,time:new Date().toISOString()};}
export function findSeller(state:MarketplaceState,slug:string){return state.sellers.find(s=>s.slug===slug);}
