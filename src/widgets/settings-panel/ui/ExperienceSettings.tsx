"use client";

import React from "react";
import { IApiSettings, UITheme } from "@shared/services/storage-service/settings";

interface ExperienceSettingsProps {
  settings: IApiSettings;
  onSettingChange: (field: keyof IApiSettings, value: string | boolean | number) => void;
}

export default function ExperienceSettings({ settings, onSettingChange }: ExperienceSettingsProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-neutral-800">
      <label className="text-sm font-medium text-neutral-400">体验外观</label>
      <div className="grid grid-cols-3 gap-2">
        {(["dark", "neon", "minimal"] as UITheme[]).map((theme) => (
          <button
            key={theme}
            onClick={() => onSettingChange("uiTheme", theme)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${settings.uiTheme === theme
              ? "bg-fuchsia-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
          >
            {theme}
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        保存后会自动应用主题，建议演示时使用 neon 主题突出视觉效果。
      </p>
    </div>
  );
}
