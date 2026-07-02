"use client";

import React, { useState } from "react";
import { DemoMaterial, listDemoMaterials, removeDemoMaterial, upsertDemoMaterial } from "@shared/services/storage-service/demo-materials";

export default function DemoMaterialEditor() {
  const [materials, setMaterials] = useState<DemoMaterial[]>(() => listDemoMaterials());
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [musicHint, setMusicHint] = useState("");

  const handleAdd = () => {
    if (!title.trim() || !script.trim()) return;
    const next = upsertDemoMaterial({
      id: `material-${Date.now()}`,
      title: title.trim(),
      script: script.trim(),
      musicHint: musicHint.trim(),
    });
    setMaterials(next);
    setTitle("");
    setScript("");
    setMusicHint("");
  };

  const handleDelete = (id: string) => {
    setMaterials(removeDemoMaterial(id));
  };

  return (
    <div className="space-y-3 pt-3 border-t border-neutral-800">
      <label className="text-sm font-medium text-neutral-400">本地素材编辑器</label>
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="素材标题"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
        />
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="演示脚本文案"
          rows={3}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm resize-none"
        />
        <input
          value={musicHint}
          onChange={(e) => setMusicHint(e.target.value)}
          placeholder="音乐提示（可选）"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
        />
        <button
          onClick={handleAdd}
          className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
        >
          保存素材
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {materials.map((item) => (
          <div key={item.id} className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-white truncate">{item.title}</p>
                <p className="text-[11px] text-neutral-500 truncate">{item.musicHint || "no music hint"}</p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
