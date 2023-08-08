import { t } from "ttag";
import React from "react";
import Button from "metabase/core/components/Button";
import { DatabaseSchemaAndTableDataSelector, SchemaAndTableDataSelector } from "metabase/query_builder/components/DataSelector";
import { TableId, DatabaseId } from "metabase-types/api";
import Database from "metabase-lib/metadata/Database";
import Table from "metabase-lib/metadata/Table";

type DatabasePickerProps = {
  databases: Database[];
  table: Table[];
  selectedSchema: String;
  selectedDatabaseId?: DatabaseId;
  selectedTableId: TableId;
  onChange?: (tableId: TableId) => void;
};

const DatabaseTablePicker = ({
  databases,
  table,
  selectedSchema,
  selectedDatabaseId,
  selectedTableId,
  onChange,
}: DatabasePickerProps) => {
  const selectedDatabase = databases.find(d => d.id === selectedDatabaseId);
  const schema = selectedSchema || "dwh_fitness_mart";
  const label = selectedTableId
    ? table.filter(e => e.id === selectedTableId)[0].display_name
    : t`Fact Table`;

  return (
    // <DatabaseSchemaAndTableDataSelector
    //   triggerClasses="inline"
    //   triggerElement={<Button onlyText>{label}</Button>}
    //   databases={databases.filter(e => e.id === 39)}
    //   selectedDatabaseId={selectedDatabase?.id}
    //   selectedSchema={schema}
    //   selectedTableId={selectedTableId}
    //   setSourceTableFn={onChange}
    // />
    <SchemaAndTableDataSelector 
      triggerClasses="inline"
      triggerElement={<Button onlyText>{label}</Button>}
      databases={databases.filter(e => e.id === 2)}
      table={table}
      selectedDatabaseId={selectedDatabase?.id}
      selectedSchema={schema}
      selectedTableId={selectedTableId}
      setSourceTableFn={onChange}
    />
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default DatabaseTablePicker;
