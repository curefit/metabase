/* eslint "react/prop-types": "warn" */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import SidebarLayout from "metabase/components/SidebarLayout";

import TableQuestions from "metabase/reference/databases/TableQuestions";
import * as metadataActions from "metabase/redux/metadata";
import * as actions from "metabase/reference/reference";

import Questions from "metabase/entities/questions";
import {
  getDatabase,
  getTable,
  getDatabaseId,
  getIsEditing,
} from "../selectors";

import TableSidebar from "./TableSidebar";

const mapStateToProps = (state, props) => ({
  database: getDatabase(state, props),
  table: getTable(state, props),
  databaseId: getDatabaseId(state, props),
  isEditing: getIsEditing(state, props),
});

const mapDispatchToProps = {
  fetchQuestions: Questions.actions.fetchList,
  ...metadataActions,
  ...actions,
};

class TableQuestionsContainer extends Component {
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
    await actions.wrappedFetchDatabaseMetadataAndQuestion(
      this.props,
      this.props.databaseId,
      schema_name,
      this.props.table.id,
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
        <TableQuestions {...this.props} />
      </SidebarLayout>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TableQuestionsContainer);
