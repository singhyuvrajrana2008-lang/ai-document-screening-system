import { supabase } from './supabase';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export interface ApiResponse<T>{success:boolean;data?:T;error?:{code:string;message:string}}
export interface ScreeningResult{screening_id:string;document?:{document_id?:string;document_type?:string;filename?:string};ocr?:{status?:string;confidence?:number;fields?:Record<string,string>};validation?:{status?:string;issues?:string[];checks?:Record<string,string>};tampering?:{status?:string;tampering_detected?:boolean;score?:number;indicators?:string[];explanation?:string};face_verification?:{status?:string;similarity_score?:number;message?:string};risk?:{score?:number;level?:string;factors?:string[];explanation?:string};status?:string;action?:string}
export interface DashboardStats{documents_screened:number;low_risk:number;medium_risk:number;high_risk:number;tampering_flags:number}
export interface HistoryItem{screening_id:string;document_type?:string;risk_level?:string;status?:string;action?:string;created_at?:string}
async function request<T>(path:string,options:RequestInit={}):Promise<T>{const {data}=await supabase.auth.getSession();const headers=new Headers(options.headers||{});if(data.session?.access_token)headers.set('Authorization',`Bearer ${data.session.access_token}`);const response=await fetch(`${API_BASE}${path}`,{...options,headers});const body:ApiResponse<T>=await response.json().catch(()=>({success:false,error:{code:'INVALID_RESPONSE',message:'Backend returned invalid JSON.'}}));if(!response.ok||!body.success)throw new Error(body.error?.message||`Request failed (${response.status})`);return body.data as T}
export const api={
 health:()=>request<{status:string;database:string}>('/health'),
 dashboardStats:()=>request<DashboardStats>('/dashboard/stats'),
 history:(page=1,limit=20)=>request<{items:HistoryItem[];page:number;limit:number;total:number}>(`/screenings?page=${page}&limit=${limit}`),
 createScreening:(file:File,documentType:string)=>{const form=new FormData();form.append('document',file);form.append('document_type',documentType);return request<{screening_id:string;screening_number:string;status:string;document_id:string}>('/screenings',{method:'POST',body:form})},
 uploadDocument:(screeningId:string,file:File,documentType:string)=>{const form=new FormData();form.append('document',file);form.append('document_type',documentType);return request<{document_id:string;screening_id:string;screening_number:string;status:string}>(`/screenings/${screeningId}/documents`,{method:'POST',body:form})},
 runScreening:(screeningId:string)=>request<{screening_id:string;status:string}>(`/screenings/${screeningId}/run`,{method:'POST'}),
 result:(screeningId:string)=>request<ScreeningResult>(`/screenings/${screeningId}`),
 action:(screeningId:string,action:'approved'|'manual_review'|'rejected'|'escalated')=>request<{screening_id:string;action:string;status:string}>(`/screenings/${screeningId}/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})})
};
export {API_BASE};
