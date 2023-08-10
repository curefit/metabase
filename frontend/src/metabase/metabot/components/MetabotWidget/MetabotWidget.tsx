import React, { useState } from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { jt, t } from "ttag";
import _ from "underscore";
import * as Urls from "metabase/lib/urls";
import Databases from "metabase/entities/databases";
import Tables from "metabase/entities/tables";
import Questions from "metabase/entities/questions";
import Search from "metabase/entities/search";
import { getUser } from "metabase/selectors/user";
import { CollectionItem, DatabaseId, User, TableId } from "metabase-types/api";
import { Dispatch, State } from "metabase-types/store";
import { canUseMetabotOnDatabase } from "metabase/metabot/utils";
import Question from "metabase-lib/Question";
import Database from "metabase-lib/metadata/Database";
import Table from "metabase-lib/metadata/Table";
import DatabasePicker from "../DatabasePicker";
import MetabotMessage from "../MetabotMessage";
import MetabotPrompt from "../MetabotPrompt";
import DatabaseTablePicker from "../DatabaseTablePicker/DatabaseTablePicker";
import { getInitialTable, getTable } from "../../selectors";
import { MetabotHeader } from "./MetabotWidget.styled";

interface DatabaseLoaderProps {
  databases: Database[];  
}

interface TableLoaderProps {
  tables: Table[];
}

interface SearchLoaderProps {
  models: CollectionItem[];
}

interface CardLoaderProps {
  model?: Question;
}

interface StateProps {
  user: User | null;
  databases: Database[];
  tables: Table[];
  tableState: TableId;
}

interface DispatchProps {  
  onSubmitQuery: (
    databaseId: DatabaseId,
    query: string,
    tableId: TableId,
  ) => void;
}

type MetabotWidgetProps = StateProps &
  DispatchProps &
  CardLoaderProps &
  DatabaseLoaderProps &
  TableLoaderProps;

const mapStateToProps = (
  state: State,
  { databases, tables }: DatabaseLoaderProps & TableLoaderProps,
): StateProps => ({
  user: getUser(state),
  databases: databases.filter(canUseMetabotOnDatabase),
  tables: tables,
  tableState: getTable(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({  
  onSubmitQuery: (databaseId, prompt, tableId) => {
    // dispatch(updateInitialTable(tableId));
    dispatch(
      push({ pathname: Urls.databaseMetabot(databaseId), 
             query: { prompt },
             state: { tableId: tableId } }),
    );
  },
});

const MetabotWidget = ({
  databases,
  tables,
  model,
  user,
  tableState,
  onSubmitQuery,
  // onTableChange,
}: // onTableChange,
MetabotWidgetProps) => {  

  const selectedDb: Database[] = databases.filter(e => e.is_metabot_enabled === true);  

  const initialDatabaseId =
    model?.databaseId ?? databases.filter(e => e.is_metabot_enabled === true)[0].id;

  const initialTableId = tables.filter(e => e.db_id === initialDatabaseId)[0].id;
  

  const [databaseId, setDatabaseId] = useState(initialDatabaseId);
  const [tableId, setTableId] = useState(initialTableId);  

  const handleDatabaseChange = (newDatabaseId: number) => {    
    setDatabaseId(newDatabaseId);        
  };

  // const tableId = tableState || tables[0].id;
  // const [selectedTable, setSeletectedTable] = useState(tableId);
  const [prompt, setPrompt] = useState("");

  const handleSubmitPrompt = () => {
    // onTableChange(selectedTable);
    onSubmitQuery(databaseId, prompt, tableId)
  };

  return (
    <MetabotHeader>
      <MetabotMessage>
        {getGreetingMessage(user)} {t`You can ask me things about your data.`}{" "}
        {databases.length > 1 &&
          jt`I’m thinking about the ${(
            <DatabasePicker
              key="picker"
              databases={selectedDb}
              selectedDatabaseId={databaseId}
              onChange={handleDatabaseChange}
            />
          )} database right now. 
          You can choose ${(
            <DatabaseTablePicker
              databases={selectedDb}              
              selectedDatabaseId={databaseId}
              // table={tables}
              selectedTableId={tableId}
              onChange={setTableId}
            />
          )}`}
      </MetabotMessage>
      <MetabotPrompt
        prompt={prompt}
        placeholder={getPromptPlaceholder(model)}
        user={user}
        onChangePrompt={setPrompt}
        onSubmitPrompt={handleSubmitPrompt}
      />
    </MetabotHeader>
  );
};

const getGreetingMessage = (user: User | null) => {
  if (user?.first_name) {
    return t`Hey there, ${user?.first_name}!`;
  } else {
    return t`Hey there!`;
  }
};

const getPromptPlaceholder = (model: Question | undefined) => {
  if (model) {
    return t`Ask something like, how many ${model?.displayName} have we had over time?`;
  } else {
    return t`Ask something…`;
  }
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default _.compose(
  Databases.loadList(),
  Tables.loadList({
    query: (state: State, { databases }: DatabaseLoaderProps) => ({
      dbId: databases.filter(e => e.is_metabot_enabled === true)[0].id,
      metabot_schemas: true,
    }),
  }),
  connect(mapStateToProps, mapDispatchToProps),
)(MetabotWidget);
