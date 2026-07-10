import { useState } from "react";
import type { Opportunity } from "../lib/api";

const STAGES = ["Discovery", "Evaluation", "Proposal", "Negotiation", "Closing"];
const PILOT = ["not started", "in progress", "successful", "failed"];
const SECURITY = ["not started", "in progress", "complete"];

export function OpportunityForm({
  samples,
  value,
  onChange,
}: {
  samples: Opportunity[];
  value: Opportunity;
  onChange: (o: Opportunity) => void;
}) {
  const [open, setOpen] = useState(false);

  const set = <K extends keyof Opportunity>(key: K, v: Opportunity[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="font-medium">Sample opportunity</span>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2"
          value={value.id ?? ""}
          onChange={(e) => {
            const sample = samples.find((s) => s.id === e.target.value);
            if (sample) onChange({ ...sample });
          }}
        >
          {samples.map((s) => (
            <option key={s.id} value={s.id}>
              {s.company}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-accent hover:underline"
      >
        {open ? "Hide editor" : "Edit or build your own"}
      </button>

      {open && (
        <div className="grid gap-3 sm:grid-cols-2 p-4 rounded-xl border border-border bg-card">
          <Field label="Company" value={value.company} onChange={(v) => set("company", v)} />
          <Field label="Stage" asSelect options={STAGES} value={value.stage} onChange={(v) => set("stage", v)} />
          <Field label="ARR (USD)" type="number" value={String(value.arr)} onChange={(v) => set("arr", Number(v))} />
          <Field label="Expected close" value={value.expectedCloseDate} onChange={(v) => set("expectedCloseDate", v)} />
          <Field label="Activity (0-10)" type="range" min={0} max={10} value={String(value.activityLevel)} onChange={(v) => set("activityLevel", Number(v))} />
          <Field label="Days since last touch" type="number" value={String(value.daysSinceLastTouch)} onChange={(v) => set("daysSinceLastTouch", Number(v))} />
          <Toggle label="Budget confirmed" checked={value.budgetConfirmed} onChange={(v) => set("budgetConfirmed", v)} />
          <Toggle label="Economic buyer identified" checked={value.economicBuyerIdentified} onChange={(v) => set("economicBuyerIdentified", v)} />
          <Toggle label="Exec sponsor engaged" checked={value.execSponsorEngaged} onChange={(v) => set("execSponsorEngaged", v)} />
          <Field label="Pilot status" asSelect options={PILOT} value={value.pilotStatus} onChange={(v) => set("pilotStatus", v)} />
          <Field label="Security review" asSelect options={SECURITY} value={value.securityReview} onChange={(v) => set("securityReview", v)} />
          <Toggle label="Discovery complete" checked={value.discoveryComplete} onChange={(v) => set("discoveryComplete", v)} />
          <Toggle label="Mutual action plan" checked={value.mutualActionPlan} onChange={(v) => set("mutualActionPlan", v)} />
          <Toggle label="Competitor in deal" checked={value.competitorInDeal} onChange={(v) => set("competitorInDeal", v)} />
          <label className="sm:col-span-2 text-sm">
            <span className="font-medium">Notes (max 500)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 min-h-[80px]"
              maxLength={500}
              value={value.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  asSelect,
  options,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  asSelect?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}) {
  return (
    <label className="text-sm block">
      <span className="font-medium">{label}</span>
      {asSelect ? (
        <select className="mt-1 w-full rounded-lg border border-border px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
          {options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : type === "range" ? (
        <div className="flex items-center gap-3 mt-1">
          <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
          <span className="telemetry w-6">{value}</span>
        </div>
      ) : (
        <input
          type={type}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
