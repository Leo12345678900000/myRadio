"use client";

import { useEffect } from "react";
import { getSettings } from "@shared/services/storage-service/settings";

function applyThemeFromSettings() {
  const settings = getSettings();
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", settings.uiTheme);
}

export default function ThemeSync() {
  useEffect(() => {
    applyThemeFromSettings();

    const onStorage = () => applyThemeFromSettings();
    const onSettingsChanged = () => applyThemeFromSettings();

    window.addEventListener("storage", onStorage);
    window.addEventListener("radio-settings-changed", onSettingsChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("radio-settings-changed", onSettingsChanged);
    };
  }, []);

  return null;
}
