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

  const arrLabel =
    value.arr >= 1_000_000
      ? `$${(value.arr / 1_000_000).toFixed(1)}M ARR`
      : `$${Math.round(value.arr / 1000)}k ARR`;

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <p className="font-display text-sm font-semibold">Opportunity</p>
          <p className="mt-0.5 text-xs text-muted">{value.stage} · {arrLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="btn-ghost text-xs"
        >
          {open ? "Hide editor" : "Edit signals"}
        </button>
      </div>

      <div className="space-y-4 p-4">
        <label className="block text-sm">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
            Sample deal
          </span>
          <select
            className="field-input appearance-none"
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

        <div className="grid grid-cols-2 gap-2 text-xs">
          <SignalPill label="Activity" value={`${value.activityLevel}/10`} good={value.activityLevel >= 7} />
          <SignalPill
            label="Last touch"
            value={`${value.daysSinceLastTouch}d ago`}
            good={value.daysSinceLastTouch <= 7}
          />
          <SignalPill label="Budget" value={value.budgetConfirmed ? "Confirmed" : "Unknown"} good={value.budgetConfirmed} />
          <SignalPill label="Pilot" value={value.pilotStatus} good={value.pilotStatus === "successful"} />
        </div>

        {open && (
          <div className="grid gap-3 rounded-xl border border-border bg-surface/80 p-4 sm:grid-cols-2">
            <Field label="Company" value={value.company} onChange={(v) => set("company", v)} />
            <Field label="Stage" asSelect options={STAGES} value={value.stage} onChange={(v) => set("stage", v)} />
            <Field label="ARR (USD)" type="number" value={String(value.arr)} onChange={(v) => set("arr", Number(v))} />
            <Field label="Expected close" value={value.expectedCloseDate} onChange={(v) => set("expectedCloseDate", v)} />
            <Field
              label="Activity (0-10)"
              type="range"
              min={0}
              max={10}
              value={String(value.activityLevel)}
              onChange={(v) => set("activityLevel", Number(v))}
            />
            <Field
              label="Days since last touch"
              type="number"
              value={String(value.daysSinceLastTouch)}
              onChange={(v) => set("daysSinceLastTouch", Number(v))}
            />
            <Toggle label="Budget confirmed" checked={value.budgetConfirmed} onChange={(v) => set("budgetConfirmed", v)} />
            <Toggle
              label="Economic buyer identified"
              checked={value.economicBuyerIdentified}
              onChange={(v) => set("economicBuyerIdentified", v)}
            />
            <Toggle label="Exec sponsor engaged" checked={value.execSponsorEngaged} onChange={(v) => set("execSponsorEngaged", v)} />
            <Field label="Pilot status" asSelect options={PILOT} value={value.pilotStatus} onChange={(v) => set("pilotStatus", v)} />
            <Field
              label="Security review"
              asSelect
              options={SECURITY}
              value={value.securityReview}
              onChange={(v) => set("securityReview", v)}
            />
            <Toggle label="Discovery complete" checked={value.discoveryComplete} onChange={(v) => set("discoveryComplete", v)} />
            <Toggle label="Mutual action plan" checked={value.mutualActionPlan} onChange={(v) => set("mutualActionPlan", v)} />
            <Toggle label="Competitor in deal" checked={value.competitorInDeal} onChange={(v) => set("competitorInDeal", v)} />
            <label className="sm:col-span-2 text-sm">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">Notes</span>
              <textarea
                className="field-input min-h-[88px] resize-y"
                maxLength={500}
                value={value.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function SignalPill({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 ${
        good ? "border-healthy/25 bg-healthy/5" : "border-border bg-surface"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-0.5 font-medium ${good ? "text-healthy" : "text-muted"}`}>{value}</p>
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
    <label className="block text-sm">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      {asSelect ? (
        <select className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "range" ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-accent"
          />
          <span className="telemetry w-6 text-ink">{value}</span>
        </div>
      ) : (
        <input type={type} className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
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
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border bg-elevated accent-accent"
      />
      <span className="text-muted">{label}</span>
    </label>
  );
}
