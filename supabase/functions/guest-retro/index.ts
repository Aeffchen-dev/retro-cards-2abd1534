import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requestSchema } from './validation.ts';
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'Methode nicht erlaubt'},405);
 try {
  if(Number(req.headers.get('content-length')??0)>210000)return reply({error:'Antworten sind zu groß'},413);
  const raw=await req.text(); if(raw.length>210000)return reply({error:'Antworten sind zu groß'},413);
  const parsed=requestSchema.safeParse(JSON.parse(raw));
  if(!parsed.success)return reply({error:'Bitte Namen und Einladungslink prüfen'},400);
  const body=parsed.data;
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return reply({error:'Verbindung momentan nicht verfügbar'},503);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  if(body.action==='create'||body.action==='join') {
   const token=randomToken(); let sid:string; let invite:string|undefined;
   if(body.action==='create'){
    invite=randomToken(); const {data,error}=await db.from('retro_guest_sessions').insert({invite_hash:await hash(invite)}).select('id').single();
    if(error||!data)return reply({error:'Retro konnte nicht erstellt werden'},500); sid=data.id;
   } else {
    const {data}=await db.from('retro_guest_sessions').select('id').eq('invite_hash',await hash(body.invite)).maybeSingle();
    if(!data)return reply({error:'Dieser Einladungslink ist ungültig oder nicht mehr aktiv'},403); sid=data.id;
   }
   const {data,error}=await db.from('retro_guest_members').insert({session_id:sid,token_hash:await hash(token),display_name:body.name,is_owner:body.action==='create'}).select('user_id').single();
   if(error||!data){if(body.action==='create')await db.from('retro_guest_sessions').delete().eq('id',sid);return reply({error:'Beitritt nicht möglich'},500);}
   return reply({sessionId:sid,memberId:data.user_id,token,invite});
  }
  const {data:member}=await db.from('retro_guest_members').select('user_id,session_id,is_owner').eq('token_hash',await hash(body.token)).maybeSingle();
  if(!member)return reply({error:'Gastzugang ist nicht mehr aktiv. Bitte erneut einladen lassen'},403);
  if(body.action==='leave'){
   const result=member.is_owner?await db.from('retro_guest_sessions').delete().eq('id',member.session_id):await db.from('retro_guest_members').delete().eq('user_id',member.user_id);
   return result.error?reply({error:'Verbindung konnte nicht getrennt werden'},500):reply({ok:true});
  }
  if(body.action==='remove'){
   if(!member.is_owner)return reply({error:'Nur wer eingeladen hat, kann Partner entfernen'},403);
   if(body.memberId===member.user_id)return reply({error:'Du kannst dich nicht selbst entfernen'},400);
   const {error}=await db.from('retro_guest_members').delete().eq('user_id',body.memberId).eq('session_id',member.session_id);
   if(error)return reply({error:'Partner konnte nicht entfernt werden'},500);
  }
  if(body.action==='update'){
   const {error}=await db.from('retro_guest_members').update({answers:body.answers,updated_at:new Date().toISOString()}).eq('user_id',member.user_id).eq('session_id',member.session_id);
   if(error)return reply({error:'Antworten konnten nicht geteilt werden'},500);
  }
  const {data:members,error}=await db.from('retro_guest_members').select('user_id,display_name,answers,is_owner').eq('session_id',member.session_id);
  return error?reply({error:'Antworten konnten nicht geladen werden'},500):reply({members});
 }catch{return reply({error:'Anfrage konnte nicht verarbeitet werden'},400);}
});
