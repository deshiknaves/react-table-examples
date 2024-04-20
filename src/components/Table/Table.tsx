'use client'

import {
  ColumnDef,
  GroupingState,
  OnChangeFn,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import get from 'lodash/fp/get'
import noop from 'lodash/noop'
import { MouseEvent, ReactNode, UIEvent, useEffect, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { match } from 'ts-pattern'
import { useVirtualizedRows } from '../../hooks/useVirtualizedRows'
import { cn } from '../../utils/cn'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { TableHeader } from './TableHeader'
import { TableLoadingIndicator } from './TableLoadingIndicator'
import { manualGroupedRowModel } from './manualGroupedRowModel'

const getSubRows = get('subRows')

type TableProps<Data extends object> = {
  children?: ReactNode
  checkSelected?: (row: Row<Data>) => boolean
  className?: string
  columns: ColumnDef<Data>[]
  data: Data[]
  grouping?: GroupingState
  isLoading?: boolean
  isVirtualized?: boolean
  onGroupingChange?: OnChangeFn<GroupingState>
  onRowClick?: (event: MouseEvent<HTMLTableRowElement>, row: Row<Data>) => void
  onScroll?: (event: UIEvent<HTMLDivElement>) => void
  onSortingChange?: OnChangeFn<SortingState>
  renderRowCells?: (row: Row<Data>) => ReactNode | void
  sorting?: SortingState
}

export function Table<Data extends object>({
  checkSelected,
  children,
  className,
  columns,
  data,
  grouping,
  isLoading = false,
  onGroupingChange = noop,
  onRowClick,
  onScroll,
  onSortingChange,
  renderRowCells,
  sorting,
}: TableProps<Data>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const table = useReactTable({
    data,
    columns,
    // The core row model runs first we need this so that the
    // subRows are mapped in correctly in the row state.
    getCoreRowModel: getCoreRowModel(),
    // Here we pass a custom grouped row model that will
    // take subRows and group then so the table can retain
    // its grouping API and functions
    getGroupedRowModel: manualGroupedRowModel(),
    // You need the expanded row model to handle the expanded
    // rows in the table
    getExpandedRowModel: getExpandedRowModel(),
    // You must pass a function that knows how to get the subRows
    getSubRows,
    // Let the consumer know when the grouping/sorting changes
    onGroupingChange,
    onSortingChange,
    // Make sure to turn of the default sorting when we handle it
    // manually
    manualSorting: true,
    enableSortingRemoval: true,
    state: {
      // Pass the state passed in from the parent
      grouping,
      sorting,
    },
  })

  const { rows } = table.getRowModel()

  const { paddingTop, paddingBottom, virtualRows } = useVirtualizedRows({
    parentRef: tableContainerRef,
    count: rows.length,
  })

  useEffect(() => {
    tableContainerRef.current?.dispatchEvent(new Event('scroll'))
  }, [])

  const headerGroups = table.getHeaderGroups()
  const isBodyLoading = isLoading && !data.length

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        {children}
        <div
          ref={tableContainerRef}
          className={cn('h-full w-full relative overflow-auto', className)}
          onScroll={onScroll}
        >
          <table
            className="min-w-full relative table-auto text-secondary-text border-collapse"
            style={{
              width: isBodyLoading ? 'auto' : table.getTotalSize(),
            }}
          >
            <thead className="sticky top-0 border-b border-gray-800 z-20 bg-black">
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHeader
                      key={header.id}
                      header={header}
                      table={table}
                    />
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isBodyLoading
                ? null
                : paddingTop > 0 && (
                    <tr>
                      <td style={{ height: `${paddingTop}px` }} />
                    </tr>
                  )}
              {isBodyLoading ? (
                <TableLoadingIndicator<Data>
                  headerGroups={table.getHeaderGroups()}
                />
              ) : (
                (virtualRows || rows).map((virtualRow, index) => {
                  const row = rows[virtualRow.index ?? index] as Row<Data>

                  if (!row) return null

                  const isSelected = checkSelected ? checkSelected(row) : false
                  const cells = row.getVisibleCells()

                  return (
                    <tr
                      key={row.id}
                      className={cn({
                        'bg-primary-500 hover:bg-primary-400 text-primary-text':
                          isSelected,
                        'bg-background-contrast hover:bg-background-default':
                          !isSelected && index % 2 === 0,
                        'hover:bg-background-default':
                          !isSelected && index % 2 === 1,
                        'cursor-pointer': Boolean(onRowClick),
                      })}
                      onClick={
                        onRowClick
                          ? (event) => onRowClick(event, row)
                          : undefined
                      }
                    >
                      {(renderRowCells && renderRowCells(row)) ??
                        cells.map((cell) => {
                          return (
                            <td
                              key={cell.id}
                              className={cn(
                                'border border-gray-800 text-sm h-full bg-black px-2 py-1',
                                {
                                  'sticky left-0 z-10':
                                    cell.column.getIsPinned(),
                                }
                              )}
                            >
                              {match({
                                grouped: cell.getIsGrouped(),
                                aggregated: cell.getIsAggregated(),
                              })
                                .with({ grouped: true }, () => (
                                  <>
                                    <button
                                      type="button"
                                      className="flex items-center gap-1"
                                      onClick={row.getToggleExpandedHandler()}
                                      style={{
                                        cursor: row.getCanExpand()
                                          ? 'pointer'
                                          : 'normal',
                                      }}
                                    >
                                      <ChevronDownIcon
                                        className={cn(
                                          'text-indigo-300 transition-all',
                                          {
                                            '-rotate-90': !row.getIsExpanded(),
                                          }
                                        )}
                                      />{' '}
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                      )}{' '}
                                      ({row.subRows.length})
                                    </button>
                                  </>
                                ))
                                .with({ aggregated: true }, () =>
                                  flexRender(
                                    cell.column.columnDef.aggregatedCell ??
                                      cell.column.columnDef.cell,
                                    cell.getContext()
                                  )
                                )
                                .otherwise(() =>
                                  cell.column.getIsGrouped()
                                    ? null
                                    : flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                      )
                                )}
                            </td>
                          )
                        })}
                    </tr>
                  )
                })
              )}
              {isBodyLoading
                ? null
                : paddingBottom > 0 && (
                    <tr>
                      <td style={{ height: `${paddingBottom}px` }} />
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </DndProvider>
    </>
  )
}
