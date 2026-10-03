export class ApiError extends Error {
 constructor(message:string,readonly status:number){super(message);}
}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 let response:Response;
 try {response=await fetch(`/api/${path}`,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),headers:body===undefined?undefined:{'Content-Type':'application/json','X-Garage-Client':'web'},body:body===undefined?undefined:JSON.stringify(body)});}
 catch {throw new ApiError('Unable to connect. Please try again.',0);}
 if(response.status===204)return undefined as T;
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new ApiError(response.status>=500?'Service unavailable. Please try again shortly.':Array.isArray(data?.message)?data.message.join('. '):data?.message||'Request failed',response.status);
 if(!data)throw new ApiError('Unexpected service response',response.status);
 return data;
}
