import type { OccurrenceWithSong } from "@/lib/service-imagery";
import type { ImageryCategory, ImageryItem } from "@/lib/types";

export type Tab = "imagery" | "categories" | "meanings" | "occurrences";

export type ModalState =
  | { type: "none" }
  | { type: "add-imagery" }
  | { type: "edit-imagery"; item: ImageryItem }
  | { type: "delete-imagery"; item: ImageryItem }
  | { type: "add-category"; parentId?: number }
  | { type: "edit-category"; category: ImageryCategory }
  | { type: "delete-category"; category: ImageryCategory }
  | { type: "delete-meaning"; meaningId: number; label: string }
  | {
      type: "delete-occurrence";
      songId: number;
      occurrenceId: number;
      label: string;
    };

export type RelationEditor =
  | { type: "none" }
  | { type: "add"; songId: number }
  | { type: "edit"; songId: number; occurrence: OccurrenceWithSong };

export type SongOption = {
  id: number;
  title: string;
  album?: string | null;
};

export type CategoryNode = ImageryCategory & {
  children: CategoryNode[];
};

export type ToastMessage = {
  type: "success" | "error";
  text: string;
};
