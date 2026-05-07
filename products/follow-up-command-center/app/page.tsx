"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checklistItems, seedLeads, seedTasks, seedTemplates } from "@/lib/seedData";
import { Lead, LeadStatus, Priority, Task, TaskStatus, Template } from "@/lib/types";

const STORAGE_KEY = "axiom-v1";
const leadStatuses: LeadStatus[] = ["New", "Contacted", "Follow-up Needed", "Waiting on Customer", "Won", "Lost"];
const taskStatuses: TaskStatus[] = ["Not Started", "In Progress", "Waiting", "Completed"];
const priorities: Priority[] = ["Low", "Medium", "High"];
const workflowSteps = [
  "Add a lead or client request",
  "Set the next action",
  "Choose a follow-up or due date",
  "Review today’s priorities",
  "Follow up before anything gets missed"
];
const builtFor = [
  "Virtual assistants",
  "Small business owners",
  "Agencies",
  "Sales teams",
  "Recruiters",
  "Customer support workflows"
];

type StoredAxiomData = {
  leads?: Lead[];
  tasks?: Task[];
  templates?: Template[];
  checklist?: Record<string, boolean>;
};

type FieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
};

const todayLabel = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "short",
  day: "numeric"
}).format(new Date());

const formatDate = (date: string) => {
  if (!date) {
    return "No date set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${date}T12:00:00`));
};

const describeDueDate = (date: string, today: string, isComplete = false) => {
  if (isComplete) {
    return "Completed";
  }

  if (!date) {
    return "No date set";
  }

  const todayDate = new Date(`${today}T12:00:00`);
  const dueDate = new Date(`${date}T12:00:00`);
  const diffDays = Math.round((dueDate.getTime() - todayDate.getTime()) / 86400000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return `Overdue by ${days} day${days === 1 ? "" : "s"}`;
  }

  if (diffDays === 1) {
    return "Tomorrow";
  }

  return `Due ${formatDate(date)}`;
};

const copyText = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back when the browser blocks direct clipboard access.
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
};

const getDueTone = (date: string, today: string, isComplete = false) => {
  if (isComplete) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  if (date < today) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (date === today) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const getDueCardEdge = (date: string, today: string, isComplete = false) => {
  if (isComplete) {
    return "border-l-slate-300";
  }

  if (date < today) {
    return "border-l-red-500";
  }

  if (date === today) {
    return "border-l-amber-500";
  }

  return "border-l-emerald-500";
};

function Field({ label, value, placeholder, type = "text", onChange }: FieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [templates, setTemplates] = useState<Template[]>(seedTemplates);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [leadFilter, setLeadFilter] = useState<LeadStatus | "All">("All");
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [copyMessage, setCopyMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const hasLoadedSavedData = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
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
        localStorage.removeItem(STORAGE_KEY);
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ leads, tasks, templates, checklist }));
    setLastSavedAt(
      new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date())
    );
  }, [leads, tasks, templates, checklist]);

  const today = new Date().toISOString().slice(0, 10);

  const activeLeads = useMemo(
    () => leads.filter((lead) => !lead.archived && lead.status !== "Won" && lead.status !== "Lost"),
    [leads]
  );

  const followUpsToday = activeLeads.filter((lead) => lead.nextFollowUpDate === today).length;
  const overdueFollowUps = activeLeads.filter((lead) => lead.nextFollowUpDate < today).length;
  const openRequests = tasks.filter((task) => task.status !== "Completed").length;
  const highPriority = tasks.filter((task) => task.priority === "High" && task.status !== "Completed").length;

  const visibleLeads = useMemo(
    () =>
      [...activeLeads]
        .filter((lead) => leadFilter === "All" || lead.status === leadFilter)
        .sort((a, b) => a.nextFollowUpDate.localeCompare(b.nextFollowUpDate)),
    [activeLeads, leadFilter]
  );

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((task) => taskFilter === "All" || task.status === taskFilter)
        .filter((task) => priorityFilter === "All" || task.priority === priorityFilter)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks, taskFilter, priorityFilter]
  );

  const attentionLeads = visibleLeads.filter((lead) => lead.nextFollowUpDate <= today);
  const attentionTasks = visibleTasks.filter((task) => task.status !== "Completed" && task.dueDate <= today);
  const checklistDone = checklistItems.filter((item) => checklist[item]).length;

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates((current) => current.map((template) => (template.id === id ? { ...template, ...updates } : template)));
  };

  const addLead = () => {
    setLeads((current) => [
      {
        id: crypto.randomUUID(),
        name: "",
        businessName: "",
        contactInfo: "",
        leadSource: "",
        status: "New",
        lastContactDate: today,
        nextFollowUpDate: today,
        priority: "Medium",
        notes: "",
        nextAction: ""
      },
      ...current
    ]);
  };

  const addTask = () => {
    setTasks((current) => [
      {
        id: crypto.randomUUID(),
        title: "",
        relatedClient: "",
        dueDate: today,
        priority: "Medium",
        status: "Not Started",
        notes: ""
      },
      ...current
    ]);
  };

  const resetDemoData = () => {
    const confirmed = window.confirm("Reset demo data? This will replace the local demo data in this browser.");
    if (!confirmed) {
      return;
    }

    setLeads(seedLeads);
    setTasks(seedTasks);
    setTemplates(seedTemplates);
    setChecklist({});
    setCopyMessage("Demo data reset.");
  };

  const handleCopyTemplate = async (body: string) => {
    const copied = await copyText(body);
    setCopyMessage(copied ? "Template copied." : "Copy blocked. Select the template text and press Ctrl+C.");
  };

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 md:px-8 md:py-10">
        <header className="grid gap-6 rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-lg md:grid-cols-[1fr_auto] md:items-end md:p-7">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
              Axiom Follow-Up Command Center · {todayLabel}
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight md:text-5xl">
              Keep every lead, follow-up, and client request from falling through the cracks.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              A simple command center for tracking follow-ups, open tasks, next actions, and what needs attention today.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              V1 demo: no login or backend yet. Data saves locally in this browser.
              {lastSavedAt ? ` Last saved at ${lastSavedAt}.` : ""}
            </p>
          </div>
          <button
            className="rounded-md border border-amber-300/40 bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-200"
            onClick={resetDemoData}
          >
            Reset Demo Data
          </button>
        </header>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">How it works</p>
              <h2 className="mt-1 text-2xl font-bold">From incoming request to completed follow-up</h2>
              <p className="mt-1 text-sm text-slate-600">A lightweight workflow that makes the next step and deadline obvious at a glance.</p>
            </div>
            <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
              Review in under 10 seconds
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[auto_1fr] md:items-center md:p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Built for</p>
            <h2 className="text-xl font-bold">Teams that cannot afford missed replies</h2>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {builtFor.map((audience) => (
              <Badge key={audience} className="border-slate-200 bg-slate-50 text-slate-700">
                {audience}
              </Badge>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Follow-ups Due Today", followUpsToday, "bg-amber-50 text-amber-800 border-amber-300"],
            ["Overdue Follow-ups", overdueFollowUps, "bg-red-50 text-red-800 border-red-300"],
            ["Open Requests", openRequests, "bg-sky-50 text-sky-800 border-sky-300"],
            ["High Priority", highPriority, "bg-violet-50 text-violet-800 border-violet-300"],
            ["Active Leads", activeLeads.length, "bg-emerald-50 text-emerald-800 border-emerald-300"]
          ].map(([label, value, tone]) => (
            <div key={String(label)} className={`rounded-lg border p-4 shadow-sm ${tone}`}>
              <p className="text-sm font-semibold">{label}</p>
              <p className="mt-2 text-3xl font-bold">{Number(value)}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div>
            <h2 className="text-xl font-bold">Today&apos;s Attention</h2>
            <p className="text-sm text-slate-600">The short list to review before something slips.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Leads to Follow Up</h3>
              <div className="mt-3 grid gap-2">
                {attentionLeads.length === 0 ? (
                  <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">No lead follow-ups need attention right now.</p>
                ) : (
                  attentionLeads.map((lead) => (
                    <div key={lead.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{lead.businessName || "Untitled lead"}</p>
                          <p className="text-sm text-slate-600">{lead.nextAction || "Next action not added yet"}</p>
                        </div>
                        <Badge className={getDueTone(lead.nextFollowUpDate, today)}>{describeDueDate(lead.nextFollowUpDate, today)}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Open Tasks to Review</h3>
              <div className="mt-3 grid gap-2">
                {attentionTasks.length === 0 ? (
                  <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">No open tasks are due or overdue right now.</p>
                ) : (
                  attentionTasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{task.title || "Untitled task"}</p>
                          <p className="text-sm text-slate-600">{task.relatedClient || "No related client"}</p>
                        </div>
                        <Badge className={getDueTone(task.dueDate, today)}>{describeDueDate(task.dueDate, today)}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold">Leads / Follow-Up Tracker</h2>
              <p className="text-sm text-slate-600">See who needs attention and what the next action is.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={leadFilter}
                onChange={(event) => setLeadFilter(event.target.value as LeadStatus | "All")}
              >
                <option>All</option>
                {leadStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={addLead}>
                Add Lead
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {visibleLeads.map((lead) => (
              <article key={lead.id} className={`rounded-lg border border-l-4 border-slate-200 bg-slate-50 p-4 ${getDueCardEdge(lead.nextFollowUpDate, today)}`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">{lead.businessName || "New lead"}</h3>
                    <p className="text-sm text-slate-600">{lead.name || "Contact name not added yet"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDueTone(lead.nextFollowUpDate, today)}>{describeDueDate(lead.nextFollowUpDate, today)}</Badge>
                    <Badge className="border-slate-200 bg-white text-slate-700">{lead.priority} Priority</Badge>
                    <Badge className="border-slate-200 bg-white text-slate-700">{lead.status}</Badge>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Contact Name" value={lead.name} placeholder="Sarah Jennings" onChange={(value) => updateLead(lead.id, { name: value })} />
                  <Field label="Business Name" value={lead.businessName} placeholder="Jennings Bakery" onChange={(value) => updateLead(lead.id, { businessName: value })} />
                  <Field label="Contact Info" value={lead.contactInfo} placeholder="Email or phone" onChange={(value) => updateLead(lead.id, { contactInfo: value })} />
                  <Field label="Lead Source" value={lead.leadSource} placeholder="Website, referral, walk-in" onChange={(value) => updateLead(lead.id, { leadSource: value })} />
                  <Field label="Last Contact Date" type="date" value={lead.lastContactDate} onChange={(value) => updateLead(lead.id, { lastContactDate: value })} />
                  <Field label="Next Follow-Up Date" type="date" value={lead.nextFollowUpDate} onChange={(value) => updateLead(lead.id, { nextFollowUpDate: value })} />
                  <SelectField label="Lead Status" value={lead.status} options={leadStatuses} onChange={(value) => updateLead(lead.id, { status: value })} />
                  <SelectField label="Priority" value={lead.priority} options={priorities} onChange={(value) => updateLead(lead.id, { priority: value })} />
                  <Field label="Next Action" value={lead.nextAction} placeholder="Send estimate" onChange={(value) => updateLead(lead.id, { nextAction: value })} />
                  <div className="md:col-span-3">
                    <TextAreaField label="Notes" value={lead.notes} placeholder="Important context, promises, or questions" onChange={(value) => updateLead(lead.id, { notes: value })} />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button className="text-sm font-semibold text-slate-600" onClick={() => updateLead(lead.id, { archived: true })}>
                    Archive
                  </button>
                  <button
                    className="text-sm font-semibold text-red-600"
                    onClick={() => {
                      const confirmed = window.confirm("Delete this lead? This cannot be undone.");
                      if (confirmed) {
                        setLeads((current) => current.filter((item) => item.id !== lead.id));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {visibleLeads.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No leads match this filter.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold">Client Request / Task Tracker</h2>
              <p className="text-sm text-slate-600">Keep open work visible until it is complete.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={taskFilter}
                onChange={(event) => setTaskFilter(event.target.value as TaskStatus | "All")}
              >
                <option>All</option>
                {taskStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as Priority | "All")}
              >
                <option>All</option>
                {priorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={addTask}>
                Add Task
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {visibleTasks.map((task) => (
              <article key={task.id} className={`rounded-lg border border-l-4 border-slate-200 bg-slate-50 p-4 ${getDueCardEdge(task.dueDate, today, task.status === "Completed")}`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">{task.title || "New task"}</h3>
                    <p className="text-sm text-slate-600">{task.relatedClient || "No related client yet"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDueTone(task.dueDate, today, task.status === "Completed")}>{describeDueDate(task.dueDate, today, task.status === "Completed")}</Badge>
                    <Badge className="border-slate-200 bg-white text-slate-700">{task.priority} Priority</Badge>
                    <Badge className="border-slate-200 bg-white text-slate-700">{task.status}</Badge>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Task Title" value={task.title} placeholder="Send proposal draft" onChange={(value) => updateTask(task.id, { title: value })} />
                  <Field label="Related Client" value={task.relatedClient} placeholder="Jennings Bakery" onChange={(value) => updateTask(task.id, { relatedClient: value })} />
                  <Field label="Due Date" type="date" value={task.dueDate} onChange={(value) => updateTask(task.id, { dueDate: value })} />
                  <SelectField label="Priority" value={task.priority} options={priorities} onChange={(value) => updateTask(task.id, { priority: value })} />
                  <SelectField label="Task Status" value={task.status} options={taskStatuses} onChange={(value) => updateTask(task.id, { status: value })} />
                  <div className="md:col-span-3">
                    <TextAreaField label="Notes" value={task.notes} placeholder="What needs to happen next?" onChange={(value) => updateTask(task.id, { notes: value })} />
                  </div>
                </div>

                <button
                  className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
                  onClick={() => updateTask(task.id, { status: "Completed" })}
                >
                  Mark Complete
                </button>
              </article>
            ))}
            {visibleTasks.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No tasks match this filter.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div>
            <h2 className="text-xl font-bold">Message Templates</h2>
            <p className="text-sm text-slate-600">Reusable messages for fast follow-up.</p>
            {copyMessage && <p className="mt-2 text-sm font-semibold text-slate-700">{copyMessage}</p>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <article key={template.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Field label="Template Name" value={template.name} onChange={(value) => updateTemplate(template.id, { name: value })} />
                <div className="mt-3">
                  <TextAreaField label="Template Body" value={template.body} onChange={(value) => updateTemplate(template.id, { body: value })} />
                </div>
                <button className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700" onClick={() => handleCopyTemplate(template.body)}>
                  Copy Template
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">Daily Checklist</h2>
              <p className="text-sm text-slate-600">A quick close-the-loop routine before work gets missed.</p>
            </div>
            <Badge className="border-slate-200 bg-slate-50 text-slate-700">
              {checklistDone} / {checklistItems.length} Done
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {checklistItems.map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item])}
                  onChange={() => setChecklist((current) => ({ ...current, [item]: !current[item] }))}
                />
                <span className={checklist[item] ? "text-sm text-slate-500 line-through" : "text-sm text-slate-700"}>{item}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
