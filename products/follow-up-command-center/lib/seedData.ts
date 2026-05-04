import { Lead, Task, Template } from "./types";

const today = new Date();
const day = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const seedLeads: Lead[] = [
  { id: "l1", name: "Sarah Jennings", businessName: "Jennings Bakery", contactInfo: "sarah@jbakery.com", leadSource: "Website Form", status: "Follow-up Needed", lastContactDate: day(-4), nextFollowUpDate: day(-1), priority: "High", notes: "Needs catering estimate for office event", nextAction: "Send revised estimate" },
  { id: "l2", name: "Carlos Diaz", businessName: "Diaz Landscaping", contactInfo: "(555) 913-4421", leadSource: "Referral", status: "Contacted", lastContactDate: day(-1), nextFollowUpDate: day(1), priority: "Medium", notes: "Interested in monthly admin support", nextAction: "Share onboarding checklist" }
];

export const seedTasks: Task[] = [
  { id: "t1", title: "Send proposal draft", relatedClient: "Jennings Bakery", dueDate: day(0), priority: "High", status: "In Progress", notes: "Include optional weekend support" },
  { id: "t2", title: "Confirm follow-up call", relatedClient: "Diaz Landscaping", dueDate: day(-2), priority: "Medium", status: "Not Started", notes: "Morning slot preferred" }
];

export const seedTemplates: Template[] = [
  { id: "m1", name: "First response to new lead", body: "Hi [Name], thanks for reaching out to us. I’d love to help. Can we schedule a quick 15-minute call this week to understand what you need?" },
  { id: "m2", name: "Follow-up after no reply", body: "Hi [Name], just checking in in case my previous message got buried. Are you still looking for support with [need]?" },
  { id: "m3", name: "Appointment reminder", body: "Hi [Name], friendly reminder about our appointment on [Date/Time]. Reply here if you need to reschedule." },
  { id: "m4", name: "Estimate follow-up", body: "Hi [Name], I wanted to follow up on the estimate I sent over. Happy to answer questions or make any adjustments." },
  { id: "m5", name: "Thank-you message", body: "Thanks again, [Name]. We appreciate your business and look forward to supporting you." },
  { id: "m6", name: "Re-engagement message", body: "Hi [Name], it’s been a little while. If you still need help with [service], I’d be glad to pick this back up with you." }
];

export const checklistItems = [
  "Check new leads",
  "Review overdue follow-ups",
  "Review follow-ups due today",
  "Review open client requests",
  "Complete or update high-priority tasks",
  "Send needed messages",
  "Set next follow-up dates"
];
