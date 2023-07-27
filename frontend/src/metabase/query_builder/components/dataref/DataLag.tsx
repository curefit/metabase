/* eslint no-unused-vars: "off" */
import React from "react";

import { t } from "ttag";
import { Table } from "metabase/components/MetadataInfo/MetadataInfo.styled";
import {
  NodeListItemLink,
  NodeListItemName,
  NodeListTitle,
  NodeListContainer,
  NodeListIcon,
  NodeListTitleText,
} from "./NodeList.styled";

interface DataLagProps {
  latest_sync_timestamp: any[];
  onDataLagClick: (item: any) => void;
}

const DataLag = ({ latest_sync_timestamp, onDataLagClick }: DataLagProps) => {
  if (latest_sync_timestamp.length === 1) {
    const dataLag = latest_sync_timestamp[0];

    return (
      <NodeListContainer>
        <NodeListTitle>
          <NodeListIcon name="table2" size="12" />
          <NodeListTitleText>Data Lag</NodeListTitleText>
        </NodeListTitle>
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
      </NodeListContainer>
    );
  }

  return (
    <NodeListContainer>
      <NodeListTitle>
        <NodeListIcon name="table2" size="12" />
        <NodeListTitleText>Data Lag</NodeListTitleText>
      </NodeListTitle>
      {latest_sync_timestamp?.map((item, index) => {
        return (
          <li key={index}>
            <NodeListItemLink>
              <NodeListItemName onClick={() => onDataLagClick(item)}>
                {item.schema_name}.{item.table_name}
              </NodeListItemName>
            </NodeListItemLink>
          </li>
        );
      })}
    </NodeListContainer>
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default DataLag;
