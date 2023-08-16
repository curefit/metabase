/* eslint-disable react/prop-types */
import React, { Component, useEffect } from "react";
import PropTypes from "prop-types";
import _ from "underscore";
import Databases from "metabase/entities/databases";
import Tables from "metabase/entities/tables";
import Schemas from "metabase/entities/schemas";
import { isSyncInProgress } from "metabase/lib/syncing";
import { PLUGIN_FEATURE_LEVEL_PERMISSIONS } from "metabase/plugins";
import { SAVED_QUESTIONS_VIRTUAL_DB_ID } from "metabase-lib/metadata/utils/saved-questions";
import MetadataTableList from "./MetadataTableList";
import MetadataSchemaList from "./MetadataSchemaList";
import { MetabaseApi } from "metabase/services";

const RELOAD_INTERVAL = 2000;

class MetadataTablePicker extends Component {
  constructor(props, context) {
    super(props, context);

    const { tables, tableId } = props;
    const selectedTable = _.findWhere(tables, { id: tableId });
    this.state = {
      selectedSchema: selectedTable ? selectedTable.schema_name : null,
      showTablePicker: true,
      tables: []
    };
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedSchema !== this.state.selectedSchema) {
        const tables = await MetabaseApi.db_metadata_schema({
          dbId: this.props.databaseId,
          schema_name: this.state.selectedSchema,
          include_hidden: true,
        });
        this.setState({ tables });
    }
  }

  static propTypes = {
    schemas: PropTypes.arrayOf(PropTypes.object),
    tableId: PropTypes.number,
    databaseId: PropTypes.number,
    selectTable: PropTypes.func.isRequired,
  };

  render() {
    const tablesBySchemaName = _.groupBy(this.props.tables, t => t.schema_name);
    // const schemas = Object.keys(tablesBySchemaName).sort((a, b) =>
    //   a.localeCompare(b),
    // );
    const schemas = this.props.schemas;    

    if (schemas.length === 1) {
      return (
        <MetadataTableList
          {...this.props}
          tables={tablesBySchemaName[schemas[0]['name']]}
        />
      );
    }
    if (this.state.selectedSchema && this.state.showTablePicker) {
      return (
        <MetadataTableList
          {...this.props}
          tables={(this.state.tables)['tables']}
          schema={this.state.selectedSchema}
          onBack={() => this.setState({ showTablePicker: false })}
        />
      );
    }
    return (
      <MetadataSchemaList
        schemas={schemas}
        selectedSchema={schemas[0]['name']}
        onChangeSchema={schema =>
          this.setState({ selectedSchema: schema, showTablePicker: true })
        }
      />
    );
  }
}

export default _.compose(
  Databases.load({
    id: (state, { databaseId }) =>
      databaseId !== SAVED_QUESTIONS_VIRTUAL_DB_ID ? databaseId : undefined,
  }),
  Schemas.loadList({
    query: (_state, { databaseId }) => ({
      dbId: databaseId,
    }),
  }),
  Tables.loadList({
    query: (state, { databaseId, schemas }) => ({
      dbId: databaseId,
      ...(schemas.length > 1 ? { schemaName: schemas[0]['name'] } : {}),      
      include_hidden: true,
      ...PLUGIN_FEATURE_LEVEL_PERMISSIONS.dataModelQueryProps,
    }),
    reloadInterval: (state, { database }, tables = []) => {
      if (
        database &&
        isSyncInProgress(database) &&
        tables.some(t => isSyncInProgress(t))
      ) {
        return RELOAD_INTERVAL;
      } else {
        return 0;
      }
    },
    selectorName: "getListUnfiltered",
  }),
)(MetadataTablePicker);
