import { connect } from "react-redux";
import _ from "underscore";
import type { LocationDescriptorObject } from "history";
import { push } from "react-router-redux";
import { checkNotNull } from "metabase/core/utils/types";
import { DatabaseId, TableId } from "metabase-types/api";
import { extractEntityId } from "metabase/lib/urls";
import Databases from "metabase/entities/databases";
import Tables from "metabase/entities/tables";
import { MetabotEntityType, State } from "metabase-types/store";
import { canUseMetabotOnDatabase } from "metabase/metabot/utils";
import Database from "metabase-lib/metadata/Database";
import Table from "metabase-lib/metadata/Table";
import Metabot from "../../components/Metabot";

interface RouterParams {
  databaseId: string;
}

interface RouteProps {
  params: RouterParams;
  location: LocationDescriptorObject;
}

interface DatabaseLoaderProps {
  databases: Database[];
}

interface TableLoaderProps {
  tables: Table[];
}

interface StateProps {
  entityId: DatabaseId;
  entityType: MetabotEntityType;
  database: Database;
  databases: Database[];
  tables: Table[];
  initialPrompt?: string;
  initialTableId?: TableId;
}

const mapStateToProps = (
  state: State,
  {
    params,
    location,
    databases,
    tables,
  }: RouteProps & DatabaseLoaderProps & TableLoaderProps,
): StateProps => {
  const entityId = checkNotNull(extractEntityId(params.databaseId));

  return {
    entityId,
    entityType: "database",
    database: Databases.selectors.getObject(state, { entityId }),
    databases: databases.filter(canUseMetabotOnDatabase),
    tables: tables,
    initialPrompt: location?.query?.prompt,
    initialTableId: location?.state?.tableId,
  };
};

const mapDispatchToProps = {
  onDatabaseChange: (databaseId: DatabaseId) =>
    push(`/metabot/database/${databaseId}`),
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default _.compose(
  Databases.loadList(),
  Tables.loadList(),
  connect(mapStateToProps, mapDispatchToProps),
)(Metabot);
