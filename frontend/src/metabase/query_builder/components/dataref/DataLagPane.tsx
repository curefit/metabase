/* eslint no-unused-vars: "off" */
import React from "react";
import { t } from "ttag";
import {
  Table,
  EmptyDescription,
} from "metabase/components/MetadataInfo/MetadataInfo.styled";
import SidebarContent from "metabase/query_builder/components/SidebarContent";
import { PaneContent } from "./Pane.styled";

interface DataLagPaneProps {
  onBack: () => void;
  onClose: () => void;
  dataLag: any;
}

const DataLagPane = ({ onBack, onClose, dataLag }: DataLagPaneProps) => {
  return (
    <SidebarContent
      title={dataLag.table_name}
      icon={"field"}
      onBack={onBack}
      onClose={onClose}
    >
      <EmptyDescription></EmptyDescription>
      <PaneContent>
        <Table>
          <tbody>
            <tr>
              <th>{t`Timezone`}</th>
              <td>UTC</td>
            </tr>
            <tr>
              <th>{t`Synced Till`}</th>
              <td>{new Date(dataLag.latest_sync_timestamp).toString()}</td>
            </tr>
            <tr>
              <th>{t`Updated Till`}</th>
              <td>{dataLag.latest_record_timestamp}</td>
            </tr>
          </tbody>
        </Table>
      </PaneContent>
    </SidebarContent>
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default DataLagPane;
