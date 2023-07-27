import React, { useEffect } from "react";
import { isSmallScreen } from "metabase/lib/dom";
import { getSetting } from "metabase/selectors/settings";
import { canUseMetabotOnDatabase } from "metabase/metabot/utils";
import { CollectionItem } from "metabase-types/api";
import { useDispatch, useSelector } from "metabase/lib/redux";
import {
  getCustomHomePageDashboardId,
  getIsMetabotEnabled,
} from "metabase/home/selectors";
import {
  useDatabaseListQuery,
  useSearchListQuery,
} from "metabase/common/hooks";
import Database from "metabase-lib/metadata/Database";
import HomeContent from "../../containers/HomeContent";
import HomeLayout from "../../containers/HomeLayout";

const SEARCH_QUERY = { models: "dataset", limit: 1 } as const;

export interface HomePageProps {
  hasMetabot: boolean;
  onOpenNavbar: () => void;
}

const HomePage = ({ onOpenNavbar }: HomePageProps): JSX.Element => {
  const databaseListState = useDatabaseListQuery();
  const modelListState = useSearchListQuery({
    query: SEARCH_QUERY,
  });

  const getHasMetabot = (
    databases: Database[] = [],
    models: CollectionItem[] = [],
    isMetabotEnabled = false,
  ) => {
    const hasModels = models.length > 0;
    const hasSupportedDatabases = databases.some(canUseMetabotOnDatabase);
    return hasModels && hasSupportedDatabases && isMetabotEnabled;
  };

  const isMetabotEnabled = useSelector(getIsMetabotEnabled);

  const hasMetabot = getHasMetabot(
    databaseListState.data,
    modelListState.data,
    isMetabotEnabled,
  );

  useEffect(() => {
    if (!isSmallScreen()) {
      onOpenNavbar();
    }
  }, [onOpenNavbar]);

  return (
    <HomeLayout hasMetabot={true}>
      <HomeContent />
    </HomeLayout>
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default HomePage;
