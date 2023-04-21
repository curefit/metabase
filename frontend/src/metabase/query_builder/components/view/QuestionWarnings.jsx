import React from "react";
import { MODAL_TYPES } from "metabase/query_builder/constants";
import { t } from "ttag";
import PropTypes from "prop-types";
import { QuestionWarningsModal } from "./QuestionWarnings.styled";
import Tooltip from "metabase/components/Tooltip";

const propTypes = {
  question: PropTypes.object.isRequired,
  onOpenModal: PropTypes.func.isRequired,
};

QuestionWarnings.propTypes = propTypes;

function QuestionWarnings(props) {
  const { question, onOpenModal } = props;

  return (
    <>
      {question &&
        question._card &&
        question._card.warnings &&
        question._card.warnings.length > 0 &&
        question._card.warnings.some(warning => warning !== null) && (
          <QuestionWarningsModal>
            <Tooltip tooltip={t`Warnings for the Card.`}>
              <a onClick={() => onOpenModal(MODAL_TYPES.WARNINGS)}>
                <span>
                  {question._card.warnings[0].warnings.length} Warning(s)
                </span>
              </a>
            </Tooltip>
          </QuestionWarningsModal>
        )}
    </>
  );
}

export default QuestionWarnings;
