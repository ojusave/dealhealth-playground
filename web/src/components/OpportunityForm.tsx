import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Collapse,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import type { Opportunity } from "../lib/api";

const STAGES = ["Discovery", "Evaluation", "Proposal", "Negotiation", "Closing"];
const PILOT = ["not started", "in progress", "successful", "failed"];
const SECURITY = ["not started", "in progress", "complete"];

const BOOL_SIGNALS: Array<{ key: keyof Opportunity; label: string }> = [
  { key: "budgetConfirmed", label: "Budget confirmed" },
  { key: "economicBuyerIdentified", label: "Economic buyer" },
  { key: "execSponsorEngaged", label: "Exec sponsor" },
  { key: "discoveryComplete", label: "Discovery complete" },
  { key: "mutualActionPlan", label: "Mutual action plan" },
  { key: "competitorInDeal", label: "Competitor in deal" },
];

export function OpportunityForm({
  samples,
  value,
  onChange,
}: {
  samples: Opportunity[];
  value: Opportunity;
  onChange: (o: Opportunity) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);

  const set = <K extends keyof Opportunity>(key: K, v: Opportunity[K]) =>
    onChange({ ...value, [key]: v });

  const selectedSignals = BOOL_SIGNALS.filter((s) => value[s.key] === true).map(
    (s) => s.key as string
  );

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <Group align="flex-end" wrap="nowrap">
          <Select
            label="Deal"
            flex={1}
            data={samples.map((s) => ({ value: s.id ?? s.company, label: s.company }))}
            value={value.id ?? value.company}
            onChange={(id) => {
              const sample = samples.find((s) => (s.id ?? s.company) === id);
              if (sample) onChange({ ...sample });
            }}
          />
          <Button variant="subtle" onClick={() => setEditorOpen((o) => !o)}>
            {editorOpen ? "Hide editor" : "Edit deal"}
          </Button>
        </Group>

        <Collapse expanded={editorOpen}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Company"
              value={value.company}
              onChange={(e) => set("company", e.currentTarget.value)}
            />
            <Select
              label="Stage"
              data={STAGES}
              value={value.stage}
              onChange={(v) => v && set("stage", v)}
            />
            <NumberInput
              label="ARR"
              value={value.arr}
              onChange={(v) => set("arr", Number(v) || 0)}
              thousandSeparator=","
              min={0}
            />
            <DatePickerInput
              label="Expected close date"
              value={value.expectedCloseDate ? dayjs(value.expectedCloseDate).toDate() : null}
              onChange={(d) =>
                set("expectedCloseDate", d ? dayjs(d).format("YYYY-MM-DD") : "")
              }
            />
            <Stack gap={4} style={{ gridColumn: "1 / -1" }}>
              <Text size="sm">Activity level</Text>
              <Slider
                value={value.activityLevel}
                onChange={(v) => set("activityLevel", v)}
                min={0}
                max={10}
                marks={[
                  { value: 0, label: "0" },
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                ]}
              />
            </Stack>
            <NumberInput
              label="Days since last touch"
              value={value.daysSinceLastTouch}
              onChange={(v) => set("daysSinceLastTouch", Number(v) || 0)}
              min={0}
            />
            <Select
              label="Pilot status"
              data={PILOT}
              value={value.pilotStatus}
              onChange={(v) => v && set("pilotStatus", v)}
            />
            <Select
              label="Security review"
              data={SECURITY}
              value={value.securityReview}
              onChange={(v) => v && set("securityReview", v)}
            />
            <Stack gap="xs" style={{ gridColumn: "1 / -1" }}>
              <Text size="sm">Deal signals</Text>
              <Chip.Group
                multiple
                value={selectedSignals}
                onChange={(keys) => {
                  onChange({
                    ...value,
                    budgetConfirmed: keys.includes("budgetConfirmed"),
                    economicBuyerIdentified: keys.includes("economicBuyerIdentified"),
                    execSponsorEngaged: keys.includes("execSponsorEngaged"),
                    discoveryComplete: keys.includes("discoveryComplete"),
                    mutualActionPlan: keys.includes("mutualActionPlan"),
                    competitorInDeal: keys.includes("competitorInDeal"),
                  });
                }}
              >
                <Group gap="xs">
                  {BOOL_SIGNALS.map((s) => (
                    <Chip key={s.key as string} value={s.key as string} variant="outline">
                      {s.label}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
            <Stack gap={4} style={{ gridColumn: "1 / -1" }}>
              <Textarea
                label="Notes"
                autosize
                minRows={3}
                maxLength={500}
                value={value.notes}
                onChange={(e) => set("notes", e.currentTarget.value)}
              />
              <Text size="xs" c="dimmed" ta="right">
                {value.notes.length}/500
              </Text>
            </Stack>
          </SimpleGrid>
        </Collapse>
      </Stack>
    </Card>
  );
}
