import { createSelector } from "@reduxjs/toolkit";
import { getSetting } from "metabase/selectors/settings";
import { State } from "metabase-types/store";

export const getActivity = state => state.home && state.home.activity;
export const getRecentViews = state => state.home && state.home.recentViews;
export const getUser = state => state.currentUser;


export const getIsMetabotEnabled = (state: State) => {
  return getSetting(state, "is-metabot-enabled");
};

export const getHasMetabotLogo = (state: State) => {
  return getSetting(state, "show-metabot");
};

export const getCustomHomePageDashboardId = createSelector(
  [getUser],
  user => user?.custom_homepage?.dashboard_id || null,
);
