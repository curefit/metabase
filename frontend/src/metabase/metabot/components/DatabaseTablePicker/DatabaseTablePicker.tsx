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
  // selectedSchema: String;
  selectedDatabaseId?: DatabaseId;
  selectedTableId: TableId;
  onChange?: (tableId: TableId) => void;
};

const DatabaseTablePicker = ({
  databases,
  table,  
  // selectedSchema,
  selectedDatabaseId,
  selectedTableId,
  onChange,
}: DatabasePickerProps) => {
  const selectedDatabase = databases.find(d => d.id === selectedDatabaseId);  

  return (
    // <DatabaseSchemaAndTableDataSelector
    //   triggerClasses="inline"
    //   triggerElement={<Button onlyText>{label}</Button>}
    //   databases={databases.filter(e => e.is_metabot_enabled === true)}
    //   selectedDatabaseId={selectedDatabase?.id}      
    //   selectedTableId={selectedTableId}
    //   setSourceTableFn={onChange}
    // />
    <SchemaAndTableDataSelector 
      triggerClasses="inline"
      // triggerElement={<Button onlyText>{label}</Button>}
      databases={databases.filter(e => e.is_metabot_enabled === true)}
      // table={table}
      // schemas={[schema]}
      // selectedSchema={table.filter(e => e.schema)}
      selectedDatabaseId={selectedDatabase?.id}      
      selectedTableId={selectedTableId}
      setSourceTableFn={onChange}
    />
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default DatabaseTablePicker;
