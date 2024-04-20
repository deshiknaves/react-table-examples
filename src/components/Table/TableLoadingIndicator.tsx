import { HeaderGroup } from '@tanstack/react-table'
import clsx from 'clsx'
import last from 'lodash/last'

const rows = Array.from({ length: 5 }).fill(null)
const rowOpacity = [
  'opacity-100',
  'opacity-90',
  'opacity-80',
  'opacity-70',
  'opacity-60',
]

export function TableLoadingIndicator<Data extends object>({
  headerGroups,
}: {
  headerGroups: HeaderGroup<Data>[]
}) {
  const row = last(headerGroups)

  if (!row) {
    return null
  }

  // Reduce opacity of loading indicator for each row
  return rows.map((_, index) => (
    <tr
      key={`loading-row-${index}`}
      className={clsx('table-loading-indicator', {
        [rowOpacity[index]]: true,
      })}
    >
      {row.headers.map((column) => (
        <td key={`loading-${column.id}`}>
          <div className="flex items-center justify-center w-full h-full">
            <div className="animate-pulsing w-full h-full pt-2 px-1">
              <div className="w-full bg-gray-800 h-5 rounded-lg" />
            </div>
          </div>
        </td>
      ))}
    </tr>
  ))
}
