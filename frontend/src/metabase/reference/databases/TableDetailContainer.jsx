/* eslint "react/prop-types": "warn" */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import TableSidebar from "./TableSidebar";
import SidebarLayout from "metabase/components/SidebarLayout";
import TableDetail from "metabase/reference/databases/TableDetail";

import * as metadataActions from "metabase/redux/metadata";
import * as actions from "metabase/reference/reference";

import {
  getDatabase,
  getTable,
  getDatabaseId,
  getIsEditing,
} from "../selectors";

const mapStateToProps = (state, props) => ({
  database: getDatabase(state, props),
  table: getTable(state, props),
  databaseId: getDatabaseId(state, props),
  isEditing: getIsEditing(state, props),
});

const mapDispatchToProps = {
  ...metadataActions,
  ...actions,
};

@connect(mapStateToProps, mapDispatchToProps)
export default class TableDetailContainer extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired,
    databaseId: PropTypes.number.isRequired,
    table: PropTypes.object.isRequired,
    isEditing: PropTypes.bool,
  };

  async fetchContainerData(showSchemaInHeader) {
    let schema_name = null;
    if (showSchemaInHeader) {
      schema_name = this.props.table.schema_name
        ? this.props.table.schema_name
        : this.props.location.pathname.split("/")[5];
    }
    await actions.wrappedFetchDatabaseMetadata(
      this.props,
      this.props.databaseId,
      schema_name,
    );
  }

  UNSAFE_componentWillMount() {
    let showSchemaInHeader = null;
    if (this.props.location.state) {
      showSchemaInHeader = this.props.location.state?.showSchemaInHeader;
    } else {
      showSchemaInHeader =
        this.props.location.pathname.split("/")[4] === "schema" ? true : false;
    }
    this.fetchContainerData(showSchemaInHeader);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (this.props.location.pathname === newProps.location.pathname) {
      return;
    }
    actions.clearState(newProps);
  }

  render() {
    const { database, table, isEditing } = this.props;
    return (
      <SidebarLayout
        className="flex-full relative"
        style={isEditing ? { paddingTop: "43px" } : {}}
        sidebar={
          <TableSidebar
            database={database}
            table={table}
            showSchemaInHeader={
              this.props.location.pathname.split("/")[4] === "schema"
            }
          />
        }
      >
        <TableDetail {...this.props} />
      </SidebarLayout>
    );
  }
}
