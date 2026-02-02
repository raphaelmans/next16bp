import { useCallback, useState } from "react";
import type { CourtBlockItem } from "./types";

export function useManageBlock({
  activeBlocksById,
  onCancelBlock,
  onOpenReplaceDialog,
  onSelect,
}: {
  activeBlocksById: Map<string, CourtBlockItem>;
  onCancelBlock: (blockId: string) => void;
  onOpenReplaceDialog?: (blockId: string) => void;
  onSelect?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) onSelect?.();
    },
    [onSelect],
  );
  const selectedBlock = selectedId
    ? (activeBlocksById.get(selectedId) ?? null)
    : null;

  const handleClose = useCallback(() => setSelectedId(null), []);

  const handleRemove = useCallback(
    (blockId: string) => {
      onCancelBlock(blockId);
      setSelectedId(null);
    },
    [onCancelBlock],
  );

  const handleConvertWalkIn = useCallback(
    (blockId: string) => {
      onOpenReplaceDialog?.(blockId);
      setSelectedId(null);
    },
    [onOpenReplaceDialog],
  );

  return {
    selectedId,
    selectedBlock,
    select: handleSelect,
    close: handleClose,
    remove: handleRemove,
    convertWalkIn: handleConvertWalkIn,
    replaceWithGuest: handleConvertWalkIn,
  };
}
