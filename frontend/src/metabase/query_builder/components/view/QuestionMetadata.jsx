import React from "react";
import { t } from "ttag";
import PropTypes from "prop-types";
import Icon from "metabase/components/Icon";
import Tooltip from "metabase/core/components/Tooltip";
import { MODAL_TYPES } from "metabase/query_builder/constants";
import { QuestionMetadataModal } from "./QuestionMetadata.styled";

const propTypes = {
  question: PropTypes.object.isRequired,
  onOpenModal: PropTypes.func.isRequired,
};

QuestionMetadata.propTypes = propTypes;

function QuestionMetadata(props) {
  const { question, onOpenModal } = props;

  return (
    <>
      {question && question._card && (
        <QuestionMetadataModal>
          <Tooltip tooltip={t`AI Assistant`}>
            <a onClick={() => onOpenModal(MODAL_TYPES.SQL_ASSISTANT)}>
              <Icon name="lightbulb" size="20" />
            </a>
          </Tooltip>
        </QuestionMetadataModal>
      )}
    </>
  );
}

export default QuestionMetadata;
