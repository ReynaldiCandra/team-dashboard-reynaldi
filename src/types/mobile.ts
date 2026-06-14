export type LeadCategory = "HOT" | "WARM" | "COLD";
export interface Lead { id:string;name:string;phone:string;child_name:string;category:LeadCategory;status:string;area:string;assigned_to:string;team:string|null;created_at:string;last_contact_at?:string|null;follow_up_date?:string|null; }
export interface LeaderboardEntry { id:string;name:string;team?:string;points?:number;closing_count?:number; }
export interface Notification { id:string;message:string;time?:string;read:boolean;from?:"Manager"|"Head Manager"|"Sistem";created_at?:string; }
export interface Task { id:string;title:string;done:boolean;priority:"high"|"medium"|"low"; }