import React, { ReactNode } from "react";
import { connect } from "react-redux";
import { getSetting } from "metabase/selectors/settings";
import MetabotWidget from "metabase/metabot/components/MetabotWidget";
import { State } from "metabase-types/store";
import HomeGreeting from "../HomeGreeting";
import GreetingSection from "../../containers/HomeGreeting";
import {
  LayoutBody,
  LayoutIllustration,
  LayoutRoot,
} from "./HomeLayout.styled";

export interface HomeLayoutProps {
  metabotSchemaArray: Record<number, any>[];
  hasMetabot?: boolean;
  showIllustration?: boolean;
  children?: ReactNode;
}

const HomeLayout = ({  
  hasMetabot,
  showIllustration,
  children,
}: HomeLayoutProps): JSX.Element => {
  return (
    <LayoutRoot>
      {showIllustration && <LayoutIllustration />}
      {hasMetabot ? <MetabotWidget/> : <GreetingSection />}
      <LayoutBody>{children}</LayoutBody>
    </LayoutRoot>
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default HomeLayout;
