"use client";

import {
  apiCreateImagery,
  apiGetImageryItems,
  apiUpdateImagery,
} from "@/lib/api/client-api";
import type { ImageryItem } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ImageryFormValues } from "@/lib/forms/imagery-form";
import type { ModalState } from "./types";

const PAGE_SIZE = 20;

export function useImageryTab(
  csrfToken: string,
  showToast: (type: "success" | "error", text: string) => void,
) {
  const [items, setItems] = useState<ImageryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const nextItems = await apiGetImageryItems();
      setItems(nextItems);
      setItemsError(null);
      return nextItems;
    } catch (error) {
      setItemsError(error instanceof Error ? error.message : "加载意象失败");
      return [];
    }
  }, []);

  const refreshItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      return await fetchItems();
    } finally {
      setItemsLoading(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    void apiGetImageryItems()
      .then((nextItems) => {
        setItems(nextItems);
        setItemsError(null);
      })
      .catch((error: unknown) => {
        setItemsError(error instanceof Error ? error.message : "加载意象失败");
      })
      .finally(() => setItemsLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [searchTerm, items]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () =>
      filteredItems.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredItems],
  );

  const openAdd = () => setModal({ type: "add-imagery" });
  const openEdit = (item: ImageryItem) =>
    setModal({ type: "edit-imagery", item });
  const closeModal = () => setModal({ type: "none" });

  const handleAdd = async ({ name }: ImageryFormValues) => {
    setIsSubmitting(true);
    try {
      const created = await apiCreateImagery(name.trim(), csrfToken);
      setItems((current) => [
        ...current,
        { ...created, count: 0, categoryIds: [], meaningCount: 0 },
      ]);
      showToast("success", `意象「${created.name}」已创建`);
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "创建意象失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async ({ name }: ImageryFormValues) => {
    if (modal.type !== "edit-imagery") return;
    setIsSubmitting(true);
    try {
      await apiUpdateImagery(modal.item.id, name.trim(), csrfToken);
      setItems((current) =>
        current.map((item) =>
          item.id === modal.item.id ? { ...item, name: name.trim() } : item,
        ),
      );
      showToast("success", "意象已更新");
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "更新意象失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    setItems,
    itemsLoading,
    itemsError,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    modal,
    setModal,
    isSubmitting,
    pagedItems,
    currentPage,
    totalPages,
    refreshItems,
    openAdd,
    openEdit,
    closeModal,
    handleAdd,
    handleEdit,
  };
}
