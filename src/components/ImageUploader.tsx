"use client";

import { useCallback, useState } from "react";

interface ImageUploaderProps {
  excursionId: string;
  onUploadComplete: () => void;
}

export function ImageUploader({ excursionId, onUploadComplete }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      setProgress(`Uploading ${i + 1} of ${fileArray.length}...`);
      const formData = new FormData();
      formData.append("image", fileArray[i]);

      await fetch(`/api/excursions/${excursionId}/scenes`, {
        method: "POST",
        body: formData,
      });
    }

    setUploading(false);
    setProgress("");
    onUploadComplete();
  }, [excursionId, onUploadComplete]);

  return (
    <div
      className={`border-[3px] border-dashed rounded-2xl p-8 text-center transition-all ${
        dragOver
          ? "border-accent bg-accent/5 scale-[1.01] shadow-[4px_4px_0_rgba(249,115,22,0.2)]"
          : "border-border hover:border-primary/50 hover:bg-primary-light/30"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
          uploadFiles(e.dataTransfer.files);
        }
      }}
    >
      {uploading ? (
        <div>
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted font-bold">{progress}</p>
        </div>
      ) : (
        <>
          <span className="text-5xl block mb-3">&#127748;</span>
          <p className="text-lg font-bold mb-1">Drop 360° images here</p>
          <p className="text-muted text-sm mb-4">or click to browse your files</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            id="file-upload"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                uploadFiles(e.target.files);
              }
            }}
          />
          <label
            htmlFor="file-upload"
            className="btn-3d inline-block px-6 py-2.5 bg-primary text-white cursor-pointer"
          >
            Browse Files
          </label>
        </>
      )}
    </div>
  );
}
