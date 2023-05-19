import React from "react";
import { t } from "ttag";

import EditableText from "metabase/core/components/EditableText";

import { PLUGIN_MODERATION } from "metabase/plugins";

import * as Urls from "metabase/lib/urls";

import QuestionActivityTimeline from "metabase/query_builder/components/QuestionActivityTimeline";

import type { Card } from "metabase-types/types/Card";

import Question from "metabase-lib/Question";

import ModelCacheManagementSection from "./ModelCacheManagementSection";
import {
  Root,
  ContentSection,
  HeaderContainer,
  HeaderLink,
} from "./QuestionInfoSidebar.styled";

interface QuestionInfoSidebarProps {
  question: Question;
  onSave: (card: Card) => Promise<Question>;
}

export const QuestionInfoSidebar = ({
  question,
  onSave,
}: QuestionInfoSidebarProps) => {
  const cache_ttl = question.cacheTTL();
  const description = question.description();
  const canWrite = question.canWrite();
  const isDataset = question.isDataset();
  const isPersisted = isDataset && question.isPersisted();
  const isCachingAvailable = true;

  const handleSave = (description: string | null) => {
    if (question.description() !== description) {
      onSave(question.setDescription(description).card());
    }
  };

  const handleUpdateCacheTTL = (cache_ttl: number | undefined) => {
    if (question.cacheTTL() !== cache_ttl) {
      return onSave(question.setCacheTTL(parseInt(cache_ttl)).card());
    }
  };

  return (
    <Root>
      <ContentSection>
        <HeaderContainer>
          <h3>{t`About`}</h3>
          {question.isDataset() && (
            <HeaderLink
              to={Urls.modelDetail(question.card())}
            >{t`Model details`}</HeaderLink>
          )}
        </HeaderContainer>
        <EditableText
          initialValue={description}
          placeholder={
            !description && !canWrite ? t`No description` : t`Add description`
          }
          isOptional
          isMultiline
          isDisabled={!canWrite}
          onChange={handleSave}
        />
        <PLUGIN_MODERATION.QuestionModerationSection question={question} />
      </ContentSection>

      {isPersisted && (
        <ContentSection extraPadding>
          <ModelCacheManagementSection model={question} />
        </ContentSection>
      )}

      {isCachingAvailable && (
        <ContentSection extraPadding>
          <HeaderContainer>
            <h3>{t`Caching`}</h3>
          </HeaderContainer>
          <EditableText
            initialValue={cache_ttl}
            isDisabled={!canWrite}
            onChange={handleUpdateCacheTTL}
            placeholder={t`Cache TTL in Hours`}
            key={`question-cache-ttl-${cache_ttl}`}
          />
        </ContentSection>
      )}
      <ContentSection extraPadding>
        <QuestionActivityTimeline question={question} />
      </ContentSection>
    </Root>
  );
};
