"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checklistItems, seedLeads, seedTasks, seedTemplates } from "@/lib/seedData";
import { Lead, LeadStatus, Priority, Task, TaskStatus, Template } from "@/lib/types";

const leadStatuses: LeadStatus[] = ["New", "Contacted", "Follow-up Needed", "Waiting on Customer", "Won", "Lost"];
const taskStatuses: TaskStatus[] = ["Not Started", "In Progress", "Waiting", "Completed"];
const priorities: Priority[] = ["Low", "Medium", "High"];

type StoredAxiomData = {
  leads?: Lead[];
  tasks?: Task[];
  templates?: Template[];
  checklist?: Record<string, boolean>;
};

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [templates, setTemplates] = useState<Template[]>(seedTemplates);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [leadFilter, setLeadFilter] = useState<LeadStatus | "All">("All");
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const hasLoadedSavedData = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("axiom-v1");
    if (!saved) {
      hasLoadedSavedData.current = true;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      try {
        const parsed = JSON.parse(saved) as StoredAxiomData;
        setLeads(parsed.leads ?? seedLeads);
        setTasks(parsed.tasks ?? seedTasks);
        setTemplates(parsed.templates ?? seedTemplates);
        setChecklist(parsed.checklist ?? {});
      } catch {
        localStorage.removeItem("axiom-v1");
      } finally {
        hasLoadedSavedData.current = true;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedData.current) {
      return;
    }

    localStorage.setItem("axiom-v1", JSON.stringify({ leads, tasks, templates, checklist }));
  }, [leads, tasks, templates, checklist]);

  const today = new Date().toISOString().slice(0, 10);
  const activeLeads = leads.filter((l) => !l.archived && l.status !== "Won" && l.status !== "Lost");
  const followUpsToday = activeLeads.filter((l) => l.nextFollowUpDate === today).length;
  const overdueFollowUps = activeLeads.filter((l) => l.nextFollowUpDate < today).length;
  const openRequests = tasks.filter((t) => t.status !== "Completed").length;
  const highPriority = tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length;

  const visibleLeads = useMemo(
    () => [...activeLeads]
      .filter((lead) => leadFilter === "All" || lead.status === leadFilter)
      .sort((a, b) => a.nextFollowUpDate.localeCompare(b.nextFollowUpDate)),
    [activeLeads, leadFilter]
  );

  const visibleTasks = useMemo(
    () => tasks.filter((t) => (taskFilter === "All" || t.status === taskFilter) && (priorityFilter === "All" || t.priority === priorityFilter)),
    [tasks, taskFilter, priorityFilter]
  );

  return <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
    <header><h1 className="text-3xl font-bold">Axiom Follow-Up Command Center</h1><p className="text-slate-600">Practical workflow dashboard so nothing important gets missed.</p></header>
    <section className="grid grid-cols-2 md:grid-cols-5 gap-3">{[["Follow-ups Due Today",followUpsToday],["Overdue Follow-ups",overdueFollowUps],["Open Client Requests",openRequests],["High-Priority Tasks",highPriority],["Active Leads",activeLeads.length]].map(([label,value])=><div key={String(label)} className="bg-white rounded-xl border p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-semibold">{Number(value)}</p></div>)}</section>

    <section className="bg-white rounded-xl border p-4 space-y-3"><h2 className="text-xl font-semibold">Leads / Follow-Up Tracker</h2>
    <div className="flex gap-2 flex-wrap"><select className="border rounded px-2 py-1" value={leadFilter} onChange={(e)=>setLeadFilter(e.target.value as LeadStatus|"All")}><option>All</option>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select><button className="border rounded px-2 py-1" onClick={()=>setLeads([{id:crypto.randomUUID(),name:"",businessName:"",contactInfo:"",leadSource:"",status:"New",lastContactDate:today,nextFollowUpDate:today,priority:"Medium",notes:"",nextAction:""},...leads])}>+ Add Lead</button></div>
    <div className="space-y-3">{visibleLeads.map(lead=><div key={lead.id} className={`rounded-lg border p-3 ${lead.nextFollowUpDate < today ? "border-red-400 bg-red-50" : ""}`}>
      <div className="grid md:grid-cols-3 gap-2">{(["name","businessName","contactInfo","leadSource","lastContactDate","nextFollowUpDate","nextAction","notes"] as const).map((f)=><input key={f} className="border rounded px-2 py-1" placeholder={f} value={lead[f]} onChange={(e)=>setLeads(leads.map(l=>l.id===lead.id?{...l,[f]:e.target.value}:l))}/>)}
      <select className="border rounded px-2 py-1" value={lead.status} onChange={(e)=>setLeads(leads.map(l=>l.id===lead.id?{...l,status:e.target.value as LeadStatus}:l))}>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select>
      <select className="border rounded px-2 py-1" value={lead.priority} onChange={(e)=>setLeads(leads.map(l=>l.id===lead.id?{...l,priority:e.target.value as Priority}:l))}>{priorities.map(s=><option key={s}>{s}</option>)}</select></div>
      <div className="mt-2"><button className="text-sm text-slate-600 mr-3" onClick={()=>setLeads(leads.map(l=>l.id===lead.id?{...l,archived:true}:l))}>Archive</button><button className="text-sm text-red-600" onClick={()=>setLeads(leads.filter(l=>l.id!==lead.id))}>Delete</button></div>
    </div>)}</div></section>

    <section className="bg-white rounded-xl border p-4 space-y-3"><h2 className="text-xl font-semibold">Client Request / Task Tracker</h2>
    <div className="flex gap-2 flex-wrap"><select className="border rounded px-2 py-1" value={taskFilter} onChange={(e)=>setTaskFilter(e.target.value as TaskStatus|"All")}><option>All</option>{taskStatuses.map(s=><option key={s}>{s}</option>)}</select><select className="border rounded px-2 py-1" value={priorityFilter} onChange={(e)=>setPriorityFilter(e.target.value as Priority|"All")}><option>All</option>{priorities.map(s=><option key={s}>{s}</option>)}</select><button className="border rounded px-2 py-1" onClick={()=>setTasks([{id:crypto.randomUUID(),title:"",relatedClient:"",dueDate:today,priority:"Medium",status:"Not Started",notes:""},...tasks])}>+ Add Task</button></div>
    {visibleTasks.map(task=><div key={task.id} className={`rounded-lg border p-3 ${task.dueDate<today && task.status!=="Completed"?"border-red-400 bg-red-50":""}`}><div className="grid md:grid-cols-3 gap-2">{(["title","relatedClient","dueDate","notes"] as const).map((f)=><input key={f} className="border rounded px-2 py-1" value={task[f]} placeholder={f} onChange={(e)=>setTasks(tasks.map(t=>t.id===task.id?{...t,[f]:e.target.value}:t))}/>)}<select className="border rounded px-2 py-1" value={task.priority} onChange={(e)=>setTasks(tasks.map(t=>t.id===task.id?{...t,priority:e.target.value as Priority}:t))}>{priorities.map(s=><option key={s}>{s}</option>)}</select><select className="border rounded px-2 py-1" value={task.status} onChange={(e)=>setTasks(tasks.map(t=>t.id===task.id?{...t,status:e.target.value as TaskStatus}:t))}>{taskStatuses.map(s=><option key={s}>{s}</option>)}</select></div><button className="text-sm text-emerald-700 mt-2 mr-3" onClick={()=>setTasks(tasks.map(t=>t.id===task.id?{...t,status:"Completed"}:t))}>Mark Complete</button></div>)}
    </section>

    <section className="bg-white rounded-xl border p-4 space-y-3"><h2 className="text-xl font-semibold">Message Templates</h2>{templates.map(template=><div key={template.id} className="border rounded p-3 space-y-2"><input className="border rounded px-2 py-1 w-full" value={template.name} onChange={(e)=>setTemplates(templates.map(t=>t.id===template.id?{...t,name:e.target.value}:t))}/><textarea className="border rounded px-2 py-1 w-full min-h-24" value={template.body} onChange={(e)=>setTemplates(templates.map(t=>t.id===template.id?{...t,body:e.target.value}:t))}/><button className="text-sm text-blue-700" onClick={()=>navigator.clipboard.writeText(template.body)}>Copy template</button></div>)}</section>

    <section className="bg-white rounded-xl border p-4"><h2 className="text-xl font-semibold mb-3">Daily Checklist</h2><div className="space-y-2">{checklistItems.map(item=><label key={item} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(checklist[item])} onChange={()=>setChecklist({...checklist,[item]:!checklist[item]})}/><span>{item}</span></label>)}</div></section>
  </main>;
}
