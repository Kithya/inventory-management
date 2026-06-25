"use client";

import { PageHeader, SectionCard } from "@/app/(components)/ui";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  ThemePreference,
  resetPreferences,
  setLowStockThreshold,
  setTheme,
} from "@/state";
import { Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import React, { useState } from "react";

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "system",
    label: "System",
    description: "Follow the device appearance.",
    icon: Monitor,
  },
  {
    value: "light",
    label: "Light",
    description: "Always use the light interface.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark interface.",
    icon: Moon,
  },
];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.global);
  const theme = settings.theme ?? "system";
  const lowStockThreshold = settings.lowStockThreshold ?? 100;
  const [thresholdInput, setThresholdInput] = useState(
    String(lowStockThreshold),
  );

  const saveThreshold = () => {
    const value = Number(thresholdInput);
    if (Number.isFinite(value) && value >= 0) {
      dispatch(setLowStockThreshold(value));
      setThresholdInput(String(Math.round(value)));
    } else {
      setThresholdInput(String(lowStockThreshold));
    }
  };

  const handleReset = () => {
    dispatch(resetPreferences());
    setThresholdInput("100");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Personalize this browser's inventory workspace."
      />

      <div className="space-y-5">
        <SectionCard
          title="Appearance"
          description="Choose how the workspace is displayed."
        >
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <button
                  aria-pressed={isSelected}
                  className={`rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10 dark:bg-blue-950/50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                  }`}
                  key={option.value}
                  onClick={() => dispatch(setTheme(option.value))}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400"
                    }`}
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Inventory thresholds"
          description="Control when products receive a low-stock warning."
        >
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
            <label className="block max-w-xs flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Low-stock threshold
              </span>
              <input
                className="field"
                min="0"
                onBlur={saveThreshold}
                onChange={(event) => setThresholdInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                step="1"
                type="number"
                value={thresholdInput}
              />
            </label>
            <p className="max-w-md text-xs leading-5 text-slate-500 sm:pt-6 dark:text-slate-400">
              Saved automatically when you leave the field or press Enter.
              Products at or below this value are marked as low stock.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Reset preferences
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Restore the default appearance, sidebar, and stock threshold.
          </p>
        </div>
        <button className="button-secondary" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
