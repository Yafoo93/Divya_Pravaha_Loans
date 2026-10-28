export type AttentionSeverity = "info" | "warning" | "danger";

export type AttentionNotification = {
  id: string;
  title: string;
  description: string;
  count: number;
  href: string;
  severity: AttentionSeverity;
};
