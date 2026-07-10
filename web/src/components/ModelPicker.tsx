import { useEffect, useMemo, useState } from "react";
import {
  Chip,
  Group,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  Badge,
} from "@mantine/core";
import { PROVIDER_LABEL } from "../constants";
import { selectableProviders, type ModelsResponse } from "../lib/api";

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

  useEffect(() => {
    if (!activeGroup?.models.length) return;
    if (!activeGroup.models.some((m) => m.id === value)) {
      onChange(activeGroup.models[0].id);
    }
  }, [activeGroup, value, onChange]);

  if (!models) {
    return (
      <Stack gap="sm">
        <Skeleton height={36} radius="md" />
        <Skeleton height={32} radius="md" />
      </Stack>
    );
  }

  if (groups.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No models available. Add provider API keys on dealhealth-api.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
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
      <Chip.Group
        multiple={false}
        value={value}
        onChange={(v) => v && onChange(v)}
      >
        <Group gap="xs">
          {activeGroup?.models.map((m) => (
            <Tooltip key={m.id} label={`Tier: ${m.tier}`} withArrow>
              <Chip value={m.id} disabled={disabled} variant="outline">
                <Group gap={4} wrap="nowrap">
                  {m.label}
                  {m.isNew && (
                    <Badge size="xs" color="indigo">
                      New
                    </Badge>
                  )}
                </Group>
              </Chip>
            </Tooltip>
          ))}
        </Group>
      </Chip.Group>
    </Stack>
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
