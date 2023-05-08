/* eslint "react/prop-types": "warn" */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import FieldSidebar from "./FieldSidebar";
import SidebarLayout from "metabase/components/SidebarLayout";
import FieldDetail from "metabase/reference/databases/FieldDetail";

import * as metadataActions from "metabase/redux/metadata";
import * as actions from "metabase/reference/reference";
import { getMetadata } from "metabase/selectors/metadata";

import {
  getDatabase,
  getTable,
  getField,
  getDatabaseId,
  getIsEditing,
} from "../selectors";

const mapStateToProps = (state, props) => ({
  database: getDatabase(state, props),
  table: getTable(state, props),
  field: getField(state, props),
  databaseId: getDatabaseId(state, props),
  isEditing: getIsEditing(state, props),
  metadata: getMetadata(state, props),
});

const mapDispatchToProps = {
  ...metadataActions,
  ...actions,
};

@connect(mapStateToProps, mapDispatchToProps)
export default class FieldDetailContainer extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    database: PropTypes.object.isRequired,
    databaseId: PropTypes.number.isRequired,
    table: PropTypes.object.isRequired,
    field: PropTypes.object.isRequired,
    isEditing: PropTypes.bool,
    metadata: PropTypes.object,
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
    const { database, table, field, isEditing } = this.props;

    return (
      <SidebarLayout
        className="flex-full relative"
        style={isEditing ? { paddingTop: "43px" } : {}}
        sidebar={
          <FieldSidebar
            database={database}
            table={table}
            field={field}
            showSchemaInHeader={
              this.props.location.pathname.split("/")[4] === "schema"
            }
          />
        }
      >
        <FieldDetail {...this.props} />
      </SidebarLayout>
    );
  }
}
