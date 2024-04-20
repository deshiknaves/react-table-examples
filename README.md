# React Table Examples

This project will be used to demonstrate how to use the `@tanstack/react-table` library to create tables in React.

## Server Side Grouping/Sorting

The first example will demonstrate how to use the `@tanstack/react-table` library to create a table that supports server side grouping and sorting and well as client side filtering. The filtering can also be done in on the server side, but for this example we will do it on the client side so we can see how a hybrid approach can be used.

The flow of the data will be as follows:

- Data will be loaded from the server (mocked in this example in `/src/datasource.ts`).
- As the user changes the grouping or sorting, will first show the changed grouping/sorting indicators, show a loading indicator, and then request the data from the server.
- Data is grouped using a from a custom `getGroupedRowModel` function that will create groups from `subRows` passed back form the server rather than on the client side (see `/src/Table/manualGroupingRowModes`).
- Then the data is updated in the table.
