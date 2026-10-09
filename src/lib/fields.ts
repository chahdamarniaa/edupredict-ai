/**
 * Human-friendly labels and grouping for known student-performance fields.
 * Only presentation: names, types and allowed values always come from the backend schema.
 */
export type GroupId = "background" | "academic" | "lifestyle" | "grades" | "other";

export const GROUPS: Array<{ id: GroupId; title: string; description: string }> = [
  { id: "background", title: "Student background", description: "Demographics, family and school context." },
  { id: "academic", title: "Academic information", description: "Study habits, support and aspirations." },
  { id: "lifestyle", title: "Lifestyle and attendance", description: "Social life, wellbeing and absences." },
  { id: "grades", title: "Previous grades", description: "Earlier period grades substantially improve prediction accuracy." },
  { id: "other", title: "Additional inputs", description: "Other fields required by the model." },
];

const META: Record<string, { label: string; group: GroupId; hint?: string }> = {
  school: { label: "School", group: "background", hint: "GP = Gabriel Pereira, MS = Mousinho da Silveira" },
  sex: { label: "Sex", group: "background", hint: "F = female, M = male" },
  age: { label: "Age", group: "background" },
  address: { label: "Address type", group: "background", hint: "U = urban, R = rural" },
  famsize: { label: "Family size", group: "background", hint: "LE3 = 3 or fewer, GT3 = more than 3" },
  pstatus: { label: "Parents' cohabitation", group: "background", hint: "T = living together, A = apart" },
  medu: { label: "Mother's education", group: "background", hint: "0 none · 1 primary (4th) · 2 5th–9th · 3 secondary · 4 higher" },
  fedu: { label: "Father's education", group: "background", hint: "0 none · 1 primary (4th) · 2 5th–9th · 3 secondary · 4 higher" },
  mjob: { label: "Mother's job", group: "background" },
  fjob: { label: "Father's job", group: "background" },
  reason: { label: "Reason for choosing school", group: "background" },
  guardian: { label: "Guardian", group: "background" },
  traveltime: { label: "Travel time", group: "background", hint: "1 <15 min · 2 15–30 min · 3 30–60 min · 4 >1 hour" },
  studytime: { label: "Weekly study time", group: "academic", hint: "1 <2 h · 2 2–5 h · 3 5–10 h · 4 >10 h" },
  failures: { label: "Previous class failures", group: "academic" },
  schoolsup: { label: "Extra educational support", group: "academic" },
  famsup: { label: "Family educational support", group: "academic" },
  paid: { label: "Paid extra classes", group: "academic" },
  activities: { label: "Extracurricular activities", group: "academic" },
  nursery: { label: "Attended nursery school", group: "academic" },
  higher: { label: "Wants higher education", group: "academic" },
  internet: { label: "Internet access at home", group: "academic" },
  romantic: { label: "In a romantic relationship", group: "academic" },
  famrel: { label: "Family relationship quality", group: "lifestyle", hint: "1 very bad – 5 excellent" },
  freetime: { label: "Free time after school", group: "lifestyle", hint: "1 very low – 5 very high" },
  goout: { label: "Going out with friends", group: "lifestyle", hint: "1 very low – 5 very high" },
  dalc: { label: "Weekday alcohol consumption", group: "lifestyle", hint: "1 very low – 5 very high" },
  walc: { label: "Weekend alcohol consumption", group: "lifestyle", hint: "1 very low – 5 very high" },
  health: { label: "Current health", group: "lifestyle", hint: "1 very bad – 5 very good" },
  absences: { label: "School absences", group: "lifestyle" },
  g1: { label: "First-period grade (G1)", group: "grades" },
  g2: { label: "Second-period grade (G2)", group: "grades" },
};

export function fieldMeta(name: string, title?: string) {
  const m = META[name.toLowerCase()];
  return {
    label: m?.label ?? title ?? name.replace(/_/g, " "),
    group: m?.group ?? ("other" as GroupId),
    hint: m?.hint,
  };
}
