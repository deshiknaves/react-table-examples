import { useVirtualizer } from '@tanstack/react-virtual'

const DEFAULT_OVERSCAN = 10
const DEFAULT_ESTIMATED_ROW_HEIGHT = 29

export function useVirtualizedRows({
  parentRef,
  count,
}: {
  parentRef: React.RefObject<HTMLElement>
  count: number
}) {
  const rowVirtualizer = useVirtualizer({
    getScrollElement: () => parentRef.current,
    count,
    estimateSize: () => DEFAULT_ESTIMATED_ROW_HEIGHT,
    overscan: DEFAULT_OVERSCAN,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  })
  const { getVirtualItems, getTotalSize } = rowVirtualizer
  const virtualRows = getVirtualItems()
  const totalSize = getTotalSize()

  let paddingTop = 0
  let paddingBottom = 0

  if (virtualRows.length > 0) {
    paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
    paddingBottom =
      virtualRows.length > 0
        ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
        : 0
  }

  return {
    paddingTop,
    paddingBottom,
    virtualRows,
  }
}
