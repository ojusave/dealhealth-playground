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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="field min-w-0 flex-1"
          value={value.id ?? ""}
          aria-label="Opportunity"
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
        <button type="button" onClick={() => setOpen(!open)} className="btn-secondary shrink-0 px-3">
          {open ? "Done" : "Edit"}
        </button>
      </div>

      {open && (
        <div className="grid gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-2">
          <Field label="Company" value={value.company} onChange={(v) => set("company", v)} />
          <Field label="Stage" asSelect options={STAGES} value={value.stage} onChange={(v) => set("stage", v)} />
          <Field label="ARR" type="number" value={String(value.arr)} onChange={(v) => set("arr", Number(v))} />
          <Field label="Close date" value={value.expectedCloseDate} onChange={(v) => set("expectedCloseDate", v)} />
          <Field
            label="Activity"
            type="range"
            min={0}
            max={10}
            value={String(value.activityLevel)}
            onChange={(v) => set("activityLevel", Number(v))}
          />
          <Field
            label="Days idle"
            type="number"
            value={String(value.daysSinceLastTouch)}
            onChange={(v) => set("daysSinceLastTouch", Number(v))}
          />
          <Toggle label="Budget" checked={value.budgetConfirmed} onChange={(v) => set("budgetConfirmed", v)} />
          <Toggle label="Buyer" checked={value.economicBuyerIdentified} onChange={(v) => set("economicBuyerIdentified", v)} />
          <Toggle label="Sponsor" checked={value.execSponsorEngaged} onChange={(v) => set("execSponsorEngaged", v)} />
          <Field label="Pilot" asSelect options={PILOT} value={value.pilotStatus} onChange={(v) => set("pilotStatus", v)} />
          <Field label="Security" asSelect options={SECURITY} value={value.securityReview} onChange={(v) => set("securityReview", v)} />
          <Toggle label="Discovery" checked={value.discoveryComplete} onChange={(v) => set("discoveryComplete", v)} />
          <Toggle label="MAP" checked={value.mutualActionPlan} onChange={(v) => set("mutualActionPlan", v)} />
          <Toggle label="Competitor" checked={value.competitorInDeal} onChange={(v) => set("competitorInDeal", v)} />
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-label-13 text-muted">Notes</span>
            <textarea
              className="field min-h-[72px] resize-y"
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
    <label className="block">
      <span className="mb-1.5 block text-label-13 text-muted">{label}</span>
      {asSelect ? (
        <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
          {options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "range" ? (
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full accent-ink"
        />
      ) : (
        <input type={type} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex h-9 cursor-pointer items-center gap-2 text-label-13 text-muted">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-ink" />
      {label}
    </label>
  );
}
