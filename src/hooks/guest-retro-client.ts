import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
export const GUEST_STORAGE_KEY = 'retro-guest-access';
const accessSchema=z.object({sessionId:z.string().uuid(),memberId:z.string().uuid(),token:z.string().regex(/^[a-f0-9]{64}$/),invite:z.string().regex(/^[a-f0-9]{64}$/).optional()});
export type GuestAccess=z.infer<typeof accessSchema>;
export function readGuestAccess():GuestAccess|null {
 try {const parsed=accessSchema.safeParse(JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY)??'null'));return parsed.success?parsed.data:null;}catch{return null;}
}
export async function guestRequest(body:Record<string,unknown>) {
 const {data,error}=await supabase.functions.invoke('guest-retro',{body});
 if(error){let message='Die Verbindung ist gerade nicht möglich. Bitte erneut versuchen.'; if('context' in error && error.context instanceof Response){try{const details=await error.context.json();if(typeof details.error==='string')message=details.error;}catch{ /* no response body */ }}throw new Error(message);}
 return data;
}
export function parseGuestAccess(value:unknown):GuestAccess{return accessSchema.parse(value);}
export function invitationFromUrl(){const params=new URLSearchParams(location.hash.slice(1));return params.get('invite')??new URLSearchParams(location.search).get('join')??'';}
