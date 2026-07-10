import { useEffect, useMemo, useState } from "react";
import {
  Group,
  Paper,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { PROVIDER_LABEL } from "../constants";
import {
  selectableProviders,
  type ModelEntry,
  type ModelsResponse,
} from "../lib/api";

const TIER_ORDER = ["flagship", "balanced", "fast"] as const;

export function usePersistedModel(
  defaultId: string,
  available: string[]
): [string, (id: string) => void] {
  const [modelId, setModelId] = useState(() => {
    const saved = localStorage.getItem("dealhealth-model");
    return saved && available.includes(saved) ? saved : defaultId;
  });

  useEffect(() => {
    if (available.includes(modelId)) localStorage.setItem("dealhealth-model", modelId);
  }, [modelId, available]);

  useEffect(() => {
    if (!available.includes(modelId) && available.length) {
      setModelId(available.includes(defaultId) ? defaultId : available[0]);
    }
  }, [available, defaultId, modelId]);

  return [modelId, setModelId];
}

function suggestedModels(models: ModelEntry[]): ModelEntry[] {
  const byTier = TIER_ORDER.map((tier) => models.find((m) => m.tier === tier)).filter(
    Boolean
  ) as ModelEntry[];
  if (byTier.length >= 3) return byTier.slice(0, 3);

  const defaults = models.filter((m) => m.default);
  const rest = models.filter((m) => !defaults.some((d) => d.id === m.id));
  return [...defaults, ...rest].slice(0, 3);
}

function selectData(models: ModelEntry[]) {
  return TIER_ORDER.map((tier) => {
    const items = models
      .filter((m) => m.tier === tier)
      .map((m) => ({ value: m.id, label: m.label }));
    if (!items.length) return null;
    return {
      group: tier.charAt(0).toUpperCase() + tier.slice(1),
      items,
    };
  }).filter(Boolean) as Array<{ group: string; items: Array<{ value: string; label: string }> }>;
}

export function ModelPicker({
  models,
  value,
  onChange,
  disabled,
}: {
  models: ModelsResponse | null;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const groups = useMemo(
    () => (models ? selectableProviders(models) : []),
    [models]
  );

  const providerKeys = groups.map(([key]) => key);
  const [provider, setProvider] = useState(providerKeys[0] ?? "openai");

  useEffect(() => {
    if (providerKeys.length && !providerKeys.includes(provider)) {
      setProvider(providerKeys[0]);
    }
  }, [providerKeys, provider]);

  const activeGroup = groups.find(([key]) => key === provider)?.[1];
  const catalog = activeGroup?.models ?? [];
  const suggested = useMemo(() => suggestedModels(catalog), [catalog]);
  const selectGroups = useMemo(() => selectData(catalog), [catalog]);
  const selected = catalog.find((m) => m.id === value);

  useEffect(() => {
    if (!catalog.length) return;
    if (!catalog.some((m) => m.id === value)) {
      onChange(suggested[0]?.id ?? catalog[0].id);
    }
  }, [catalog, value, onChange, suggested]);

  if (!models) {
    return (
      <Paper className="dh-panel" p="md">
        <Stack gap="sm">
          <Skeleton height={14} width={60} radius="sm" />
          <Skeleton height={36} radius="md" />
          <Skeleton height={40} radius="md" />
        </Stack>
      </Paper>
    );
  }

  if (groups.length === 0) {
    return (
      <Paper className="dh-panel" p="md">
        <Text size="sm" c="dimmed">
          No models available. Add provider API keys on dealhealth-api.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper className="dh-panel" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text className="dh-section-title">Model</Text>
          <Text size="xs" c="dimmed">
            {catalog.length} available
          </Text>
        </Group>

        <SegmentedControl
          value={provider}
          onChange={setProvider}
          disabled={disabled}
          data={groups.map(([key]) => ({
            value: key,
            label: PROVIDER_LABEL[key] ?? key,
          }))}
          fullWidth
        />

        {suggested.length > 0 && (
          <Stack gap={6}>
            <Text size="xs" c="dimmed">
              Suggested
            </Text>
            <Group gap="xs" grow preventGrowOverflow={false}>
              {suggested.map((m) => {
                const active = m.id === value;
                return (
                  <UnstyledButton
                    key={m.id}
                    disabled={disabled}
                    onClick={() => onChange(m.id)}
                    className={`dh-model-pick${active ? " dh-model-pick--active" : ""}`}
                  >
                    <Text size="sm" fw={active ? 600 : 500} lineClamp={1}>
                      {m.label}
                    </Text>
                    <Text size="xs" c="dimmed" tt="capitalize">
                      {m.tier}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Group>
          </Stack>
        )}

        <Select
          label="All models"
          placeholder="Search models"
          searchable
          nothingFoundMessage="No match"
          disabled={disabled}
          value={value}
          onChange={(id) => id && onChange(id)}
          data={selectGroups}
          allowDeselect={false}
        />

        {selected && (
          <Text size="xs" c="dimmed">
            Selected: {selected.label} · {selected.tier}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

export function modelLabel(models: ModelsResponse | null, modelId: string): string {
  if (!models) return "model";
  for (const [, group] of selectableProviders(models)) {
    const match = group.models.find((m) => m.id === modelId);
    if (match) return match.label;
  }
  return modelId;
}
