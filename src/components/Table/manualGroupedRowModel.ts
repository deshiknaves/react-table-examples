import type { Row, RowData, RowModel, Table } from '@tanstack/react-table'
import {
  createRow,
  flattenBy,
  getMemoOptions,
  memo,
} from '@tanstack/react-table'

export function manualGroupedRowModel<TData extends RowData>(): (
  table: Table<TData>
) => () => RowModel<TData> {
  return (table) =>
    memo(
      () => [table.getState().grouping, table.getPreGroupedRowModel()],
      (grouping, rowModel) => {
        try {
          if (!rowModel.rows.length || !grouping.length) {
            return rowModel
          }

          // Filter the grouping list down to columns that exist
          const existingGrouping = grouping.filter((columnId) =>
            table.getColumn(columnId)
          )

          const groupedFlatRows: Row<TData>[] = []
          const groupedRowsById: Record<string, Row<TData>> = {}

          // Recursively group the data
          const groupUpRecursively = (
            rows: Row<TData>[],
            depth = 0,
            parentId?: string
          ): Row<TData>[] => {
            // Grouping depth has been been met
            // Stop grouping and simply rewrite thd depth and row relationships
            if (depth >= existingGrouping.length) {
              return rows.map((row) => {
                row.depth = depth

                groupedFlatRows.push(row)
                groupedRowsById[row.id] = row

                if (row.subRows.length) {
                  row.subRows = groupUpRecursively(
                    row.subRows,
                    depth + 1,
                    row.id
                  )
                }

                return row
              })
            }

            const columnId = existingGrouping[depth]

            if (!columnId) {
              throw new Error('Column not found')
            }

            return rows.map((row) => {
              const groupingValue = row.getGroupingValue(columnId)
              const id = row.id

              const subRows = groupUpRecursively(row.subRows, depth + 1, id)

              const leafRows = depth
                ? flattenBy(row.subRows, (row) => row.subRows)
                : row.subRows

              const groupedRow = createRow(
                table,
                id,
                row.original,
                0,
                depth,
                undefined,
                parentId
              )

              return Object.assign(groupedRow, {
                groupingColumnId: columnId,
                groupingValue,
                subRows,
                leafRows,
              })
            })
          }

          const groupedRows = groupUpRecursively(rowModel.rows, 0)

          groupedRows.forEach((subRow) => {
            groupedFlatRows.push(subRow)
            groupedRowsById[subRow.id] = subRow
          })

          return {
            rows: groupedRows,
            flatRows: groupedFlatRows,
            rowsById: groupedRowsById,
          }
        } catch (error) {
          return rowModel
        }
      },
      getMemoOptions(table.options, 'debugTable', 'getGroupedRowModel', () => {
        table._queue(() => {
          table._autoResetExpanded()
          table._autoResetPageIndex()
        })
      })
    )
}
