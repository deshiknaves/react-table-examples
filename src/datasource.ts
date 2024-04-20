import { faker } from '@faker-js/faker'
import { GroupingState, SortingState } from '@tanstack/react-table'
import identity from 'lodash/fp/identity'
import reverse from 'lodash/fp/reverse'
import sortBy from 'lodash/fp/sortBy'
import groupBy from 'lodash/groupBy'
import sample from 'lodash/sample'

export type Person = {
  id: number
  firstName: string
  lastName: string
  age: number
  status: string
  group: string
  subRows?: Person[]
}

type PersonKeys = keyof Person

function count(items: Person[]) {
  return items.length
}

function average(items: Person[], key: keyof Person) {
  return (
    items.reduce((acc, item) => acc + Number(item[key]), 0) / items.length
  ).toFixed(2)
}

const aggregations = {
  id: count,
  firstName: count,
  lastName: count,
  age: average,
  status: count,
  group: count,
  subRows: count,
}

const people: Person[] = Array.from({ length: 100 }, (_, index) => {
  const age = faker.number.int({ min: 2, max: 100 })

  return {
    id: index,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    age,
    status: sample(['relationship', 'complicated', 'single']),
    group: age >= 18 ? 'adult' : 'minor',
  }
})

function groupRows(
  items: Person[],
  groups: string[],
  keys: PersonKeys[],
  sorting: (data: Person[]) => Person[]
) {
  const [grouping, ...rest] = groups

  const grouped = groupBy(sorting(items), grouping)

  // Aggregate each column
  const rows: unknown[] = []
  for (const [group, items] of Object.entries(grouped)) {
    const columns: [unknown, unknown][] = keys
      .filter((k) => k !== grouping || k === 'subRows')
      .map((key) =>
        key in aggregations ? [key, aggregations[key](items, key)] : [key, null]
      )

    columns.push([grouping, group])
    columns.push([
      'subRows',
      rest.length ? groupRows(items, rest, keys, sorting) : items,
    ])
    rows.push(Object.fromEntries(columns))
  }

  return rows as Person[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const createSort = (sorting: SortingState) => {
  if (!sorting.length) return (data: Person[]) => data
  return (data: Person[]) => {
    const order = sorting[0].desc ? identity : reverse
    return order(sortBy(sorting[0].id, data))
  }
}

// This simulates a server side data loading function
// There is a 1 second delay to simulate network latency
export async function getPeople({
  grouping,
  sorting,
}: {
  grouping: GroupingState
  sorting: SortingState
}): Promise<Person[]> {
  await sleep(1000)
  const keys = Object.keys(people[0]) as PersonKeys[]
  const sortFunction = createSort(sorting)

  if (grouping.length) {
    return groupRows(people, grouping, keys, sortFunction)
  }

  return sortFunction(people)
}
