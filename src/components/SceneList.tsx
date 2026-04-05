"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Scene, sceneToUrls } from "@/types";

interface SceneListProps {
  excursionId: string;
  scenes: Scene[];
  onReorder: () => void;
  onDelete: (sceneId: string) => void;
}

function SortableScene({
  scene,
  excursionId,
  onDelete,
  onUpdate,
}: {
  scene: Scene;
  excursionId: string;
  onDelete: () => void;
  onUpdate: (data: { title?: string; description?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(scene.title || "");
  const [description, setDescription] = useState(scene.description || "");

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: scene.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const urls = sceneToUrls(scene, excursionId);
  const thumbUrl = urls.thumbUrl ?? urls.imageUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-surface border-2 border-border rounded-xl p-3 shadow-[3px_3px_0_#e2e8f0] hover:shadow-[3px_3px_0_#93c5fd] hover:border-primary/50 transition-all"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted hover:text-primary p-1 transition-colors"
        title="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <img
        src={thumbUrl}
        alt={scene.title || "Scene"}
        className="w-24 h-14 object-cover rounded-lg"
      />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Scene title"
              className="w-full px-3 py-1.5 border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary/50"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-1.5 border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onUpdate({ title, description });
                  setEditing(false);
                }}
                className="text-xs px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-bold"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs px-4 py-1.5 text-muted hover:text-foreground font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-bold text-sm truncate">{scene.title || "Untitled"}</p>
            {scene.description && (
              <p className="text-xs text-muted truncate">{scene.description}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => setEditing(!editing)}
          className="p-1.5 text-muted hover:text-primary rounded-lg hover:bg-primary-light transition-all"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-red-50 transition-all"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function SceneList({ excursionId, scenes, onReorder, onDelete }: SceneListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = scenes.findIndex((s) => s.id === active.id);
    const newIndex = scenes.findIndex((s) => s.id === over.id);

    const reordered = [...scenes];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((s, i) => ({ id: s.id, sortOrder: i }));

    await fetch(`/api/excursions/${excursionId}/scenes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes: updates }),
    });

    onReorder();
  }

  async function handleUpdate(sceneId: string, data: { title?: string; description?: string }) {
    await fetch(`/api/excursions/${excursionId}/scenes/${sceneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onReorder();
  }

  if (scenes.length === 0) {
    return (
      <div className="text-center py-10 bg-surface border-[3px] border-dashed border-border rounded-2xl">
        <span className="text-4xl block mb-2">&#127912;</span>
        <p className="text-muted font-medium">
          No scenes yet. Upload some 360° images above!
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {scenes.map((scene) => (
            <SortableScene
              key={scene.id}
              scene={scene}
              excursionId={excursionId}
              onDelete={() => onDelete(scene.id)}
              onUpdate={(data) => handleUpdate(scene.id, data)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
