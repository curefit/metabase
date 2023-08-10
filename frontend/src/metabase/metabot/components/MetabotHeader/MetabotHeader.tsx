import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { jt, t } from "ttag";
import * as Urls from "metabase/lib/urls";
import { getUser } from "metabase/selectors/user";
import {
  TableId,
  DatabaseId,
  MetabotFeedbackType,
  User,
} from "metabase-types/api";
import { Dispatch, MetabotQueryStatus, State } from "metabase-types/store";
import Question from "metabase-lib/Question";
import Database from "metabase-lib/metadata/Database";
import Table from "metabase-lib/metadata/Table";
import {
  cancelQuery,
  runPromptQuery,
  updateDatabase,
  updatePrompt,
  updateTable,
} from "../../actions";
import {
  getFeedbackType,
  getQueryStatus,
  getPrompt,
  getTable,
} from "../../selectors";
import MetabotMessage from "../MetabotMessage";
import MetabotPrompt from "../MetabotPrompt";
import ModelLink from "../ModelLink";
import DatabasePicker from "../DatabasePicker";
import DatabaseTablePicker from "../DatabaseTablePicker/DatabaseTablePicker";
import { MetabotHeaderRoot } from "./MetabotHeader.styled";

interface OwnProps {
  model?: Question;
  database?: Database;
  databases?: Database[];
  table?: Table;
  tables?: Table[];
}

interface StateProps {
  prompt: string;
  queryStatus: MetabotQueryStatus;
  feedbackType: MetabotFeedbackType | null;
  tableState: TableId;
  user: User | null;
}

interface DispatchProps {
  onChangePrompt: (prompt: string) => void;
  onSubmitPrompt: () => void;
  onDatabaseChange: (databaseId: DatabaseId) => void;
  onTableChange: (tableId: TableId) => void;
  onCancel: () => void;
}

type MetabotHeaderProps = OwnProps & StateProps & DispatchProps;

const mapStateToProps = (state: State): StateProps => ({
  prompt: getPrompt(state),
  queryStatus: getQueryStatus(state),
  feedbackType: getFeedbackType(state),
  user: getUser(state),
  tableState: getTable(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onChangePrompt: prompt => dispatch(updatePrompt(prompt)),  
  onSubmitPrompt: () => dispatch(runPromptQuery()),
  // onDatabaseChange: databaseId => push(Urls.databaseMetabot(databaseId)),
  onDatabaseChange: databaseId => {
    dispatch(updateTable(null));
    // dispatch(updateDatabase(databaseId)); // Clear the selected table when changing the database
    push(Urls.databaseMetabot(databaseId)); // Update the selected database
  },
  onCancel: () => dispatch(cancelQuery()),
  onTableChange: tableId => dispatch(updateTable(tableId)),
});

const MetabotHeader = ({
  prompt,
  queryStatus,
  model,
  database,
  databases = [],
  table,
  tables = [],
  user,
  tableState,
  onChangePrompt,
  onSubmitPrompt,
  onDatabaseChange,
  onTableChange,
  onCancel,
}: MetabotHeaderProps) => {
  const [isLoadedRecently, setIsLoadedRecently] = useState(false);

  useEffect(() => {
    if (queryStatus !== "complete") {
      return;
    }

    setIsLoadedRecently(true);
    const timerId = setTimeout(() => setIsLoadedRecently(false), 5000);
    return () => clearTimeout(timerId);
  }, [queryStatus]);

  const title = getTitle(
    model,
    database,
    databases,
    table,
    tables,
    user,
    queryStatus === "running",
    tableState,
    isLoadedRecently,
    onDatabaseChange,
    onTableChange,
  );
  const placeholder = getPlaceholder(model);

  return (
    <MetabotHeaderRoot>
      <MetabotMessage>{title}</MetabotMessage>
      <MetabotPrompt
        prompt={prompt}
        placeholder={placeholder}
        user={user}
        isLoading={queryStatus === "running"}
        onChangePrompt={onChangePrompt}
        onSubmitPrompt={onSubmitPrompt}
        onCancel={onCancel}
      />
    </MetabotHeaderRoot>
  );
};

const getTitle = (
  model: Question | undefined,
  database: Database | undefined,
  databases: Database[],
  table: Table | undefined,
  tables: Table[],
  user: User | null,
  isLoading: boolean,
  tableState: TableId,
  isLoadedRecently: boolean,
  onDatabaseChange: (databaseId: number) => void,
  onTableChange: (tableId: TableId) => void,
) => {
  if (isLoading) {
    return t`A wise, insightful question, indeed.`;
  }
  if (isLoadedRecently) {
    return t`Here you go!`;
  }

  if (model) {
    return getModelTitle(model, user);
  } else if (databases.length > 1 && database) {
    return getDatabaseTitle(
      database,
      databases,
      table,
      tableState,
      tables,
      user,
      onDatabaseChange,
      onTableChange,
    );
  } else {
    return t`You can ask me things about your data.`;
  }
};

const getModelTitle = (model: Question, user: User | null) => {
  const link = <ModelLink model={model} />;
  const name = user?.first_name;

  return name
    ? jt`What do you want to know about ${link}, ${name}?`
    : jt`What do you want to know about ${link}?`;
};

const getDatabaseTitle = (
  database: Database,
  databases: Database[] = [],
  table: Table,
  tableState: TableId,
  tables: Table[] = [],
  user: User | null,
  onDatabaseChange: (databaseId: number) => void,
  onTableChange: (tableId: TableId) => void,
) => {
  const name = user?.first_name;  
  const tableId = tableState || tables[0].id;

  const databasePicker = (
    <DatabasePicker
      databases={[database]}
      selectedDatabaseId={database.id}
      onChange={onDatabaseChange}
    />
  );
  const tablePicker = (
    <DatabaseTablePicker
      databases={[database]}
      table={tables}      
      selectedDatabaseId={database.id}
      selectedTableId={tableId}
      onChange={onTableChange}
    />
  );

  return name
    ? jt`What do you want to know about ${databasePicker} and ${tablePicker}, ${name}?`
    : jt`What do you want to know about ${databasePicker} and ${tablePicker}?`;
};

const getPlaceholder = (model?: Question) => {
  if (model) {
    return t`Ask something…`;
  } else {
    return t`Ask something…`;
  }
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default connect(mapStateToProps, mapDispatchToProps)(MetabotHeader);
