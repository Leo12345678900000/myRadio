const DEMO_MATERIALS_KEY = "aetherwave_demo_materials";

export interface DemoMaterial {
  id: string;
  title: string;
  script: string;
  musicHint: string;
  updatedAt: number;
}

const DEFAULT_MATERIALS: DemoMaterial[] = [
  {
    id: "material-welcome",
    title: "Welcome Intro",
    script: "欢迎来到 AetherWave，这是一个多 Agent 前端演示场景。",
    musicHint: "lofi chill",
    updatedAt: Date.now(),
  },
];

export function listDemoMaterials(): DemoMaterial[] {
  if (typeof window === "undefined") return DEFAULT_MATERIALS;

  try {
    const stored = localStorage.getItem(DEMO_MATERIALS_KEY);
    if (!stored) return DEFAULT_MATERIALS;
    const parsed = JSON.parse(stored) as DemoMaterial[];
    return parsed.length > 0 ? parsed : DEFAULT_MATERIALS;
  } catch {
    return DEFAULT_MATERIALS;
  }
}

export function saveDemoMaterials(materials: DemoMaterial[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_MATERIALS_KEY, JSON.stringify(materials));
}

export function upsertDemoMaterial(input: Omit<DemoMaterial, "updatedAt">): DemoMaterial[] {
  const materials = listDemoMaterials();
  const next: DemoMaterial = { ...input, updatedAt: Date.now() };
  const index = materials.findIndex((item) => item.id === input.id);
  if (index >= 0) {
    materials[index] = next;
  } else {
    materials.unshift(next);
  }
  saveDemoMaterials(materials);
  return materials;
}

export function removeDemoMaterial(id: string): DemoMaterial[] {
  const materials = listDemoMaterials().filter((item) => item.id !== id);
  saveDemoMaterials(materials);
  return materials;
}
