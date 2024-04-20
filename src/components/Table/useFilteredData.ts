import { useMemo } from 'react'

type UseFilteredData<Data extends object> = {
  data?: Data[] | null
  search?: string
}

export function useFilteredData<Data extends object>({
  data,
  search,
}: UseFilteredData<Data>): [Data[] | undefined] {
  const filteredData = useMemo(() => {
    if (!search || !data) {
      return data
    }

    function filterRecursively(rows: Data[]): Data[] {
      if (!search) return rows
      return rows
        .map((row) => {
          const subRows =
            'subRows' in row
              ? filterRecursively(row.subRows as Data[])
              : undefined

          // If any of the subRows are visible, return the row with the subRows
          if (subRows?.length) {
            return { ...row, subRows }
          }

          // If none of the subRows are visible, check the row itself
          // should be visible
          return Object.values(row).some((cell) => {
            return String(cell).toLowerCase().includes(search?.toLowerCase())
          })
            ? row
            : undefined
        })
        .filter(Boolean)
    }

    return filterRecursively(data)
  }, [data, search])

  return [filteredData || undefined]
}
