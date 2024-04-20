import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ColumnDef,
  GroupingState,
  SortingState,
  createColumnHelper,
} from '@tanstack/react-table'
import startCase from 'lodash/startCase'
import { useState } from 'react'
import { InlineLoadingIndicator } from './components/InlineLoadingIndicator'
import { Table } from './components/Table/Table'
import { TableRowGroups } from './components/Table/TableRowGroups'
import { useFilteredData } from './components/Table/useFilteredData'
import { Person, getPeople } from './datasource'

const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.group({
    id: 'name',
    header: 'Name',
    columns: [
      columnHelper.accessor('firstName', {
        header: 'First Name',
      }),
      columnHelper.accessor('lastName', {
        header: 'Last Name',
      }),
    ],
  }),
  columnHelper.group({
    id: 'details',
    header: 'Details',
    columns: [
      columnHelper.accessor('age', {
        header: 'Age',
      }),
      columnHelper.accessor('status', {
        cell: (info) => startCase(info.getValue()),
        header: 'Status',
      }),
      columnHelper.accessor('group', {
        cell: (info) => startCase(info.getValue()),
        header: 'Adult/Minor',
      }),
    ],
  }),
] satisfies ColumnDef<Person>[]

function App() {
  // Save the state outside the table component so that it can
  // be passed into the data loading function
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // In this example the search is done on the client side
  // but sorting and grouping is done on the server side.
  // This is to illustrate how to combine client and server side
  // filtering.
  // You can easily change this to server side filtering by
  // passing the search value to the data loading function.
  const [search, setSearch] = useState<string>('')

  // Load the data, but keep previous data so that the table
  // doesn't empty out when the key changes
  // Pass sorting and grouping to the data loading function
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['people', { grouping, sorting }],
    queryFn: async () => {
      const response = await getPeople({ grouping, sorting })

      return [response, grouping] as const
    },
    placeholderData: keepPreviousData,
  })

  // This takes the search and filters the data on the client side
  const [filteredData] = useFilteredData<Person>({
    data: data?.[0],
    search,
  })

  return (
    <div className="h-screen relative">
      <Table
        columns={columns}
        data={filteredData || []}
        grouping={data?.[1]}
        isLoading={isLoading}
        onGroupingChange={setGrouping}
        onSortingChange={setSorting}
        sorting={sorting}
      >
        <div className="flex items-center bg-gray-900">
          <TableRowGroups grouping={grouping || []} onChange={setGrouping} />
          <div className="px-2 py-1">
            <input
              type="search"
              placeholder="Search..."
              className="bg-transparent focus:bg-transparent focus-visible:outline outline-blue-500 px-2 rounded-md text-sm"
              onChange={(event) => setSearch(event.target.value)}
              value={search}
            />
          </div>
        </div>
      </Table>
      {isPlaceholderData && data?.[0]?.length ? (
        <div className="fixed bottom-1 right-1 z-20 p-3">
          <InlineLoadingIndicator />
        </div>
      ) : null}
    </div>
  )
}

export default App
