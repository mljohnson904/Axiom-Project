export type LeadStatus = "New" | "Contacted" | "Follow-up Needed" | "Waiting on Customer" | "Won" | "Lost";
export type Priority = "Low" | "Medium" | "High";

export type Lead = {
  id: string;
  name: string;
  businessName: string;
  contactInfo: string;
  leadSource: string;
  status: LeadStatus;
  lastContactDate: string;
  nextFollowUpDate: string;
  priority: Priority;
  notes: string;
  nextAction: string;
  archived?: boolean;
};

export type TaskStatus = "Not Started" | "In Progress" | "Waiting" | "Completed";

export type Task = {
  id: string;
  title: string;
  relatedClient: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  notes: string;
};

export type Template = { id: string; name: string; body: string };
