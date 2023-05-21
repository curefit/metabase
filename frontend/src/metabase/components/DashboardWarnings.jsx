import React, { useState } from "react";
import { t } from "ttag";
import PropTypes from "prop-types";
import Tooltip from "metabase/core/components/Tooltip";
import { DashboardWarningsModal } from "./DashboardWarnings.styled";
import DashboardWarningsModalComponent from "./DashboardWarningsModalComponent";

const propTypes = {
  item: PropTypes.shape({
    "last-edit-info": PropTypes.shape({
      id: PropTypes.number.isRequired,
      email: PropTypes.string.isRequired,
      first_name: PropTypes.string.isRequired,
      last_name: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
    }).isRequired,
    ordered_cards: PropTypes.object,
  }),
};

DashboardWarnings.propTypes = propTypes;

function getWarningsLength(item) {
  let warningsLength = 0;
  item.ordered_cards.forEach(orderedCard => {
    if (orderedCard.card.warnings) {
      orderedCard.card.warnings.forEach(warningsByCard => {
        if (warningsByCard && warningsByCard.warnings) {
          warningsByCard.warnings.forEach(eachWarning => {
            warningsLength = warningsLength + 1;
          });
        }
      });
    }
  });
  return warningsLength;
}

function DashboardWarnings(props) {
  const { item } = props;

  const [modalOpen, setModalOpen] = useState(null);

  const onOpenModal = modalName => {
    setModalOpen(modalName);
  };

  const onCloseModal = () => {
    setModalOpen(null);
  };

  const warningsLength = getWarningsLength(item);

  return (
    <>
      {item &&
        item.ordered_cards &&
        item.ordered_cards.some(
          card =>
            Object.prototype.hasOwnProperty.call(card.card, "warnings") &&
            Array.isArray(card.card.warnings) &&
            card.card.warnings.length > 0 &&
            card.card.warnings.some(warning => warning !== null),
        ) && (
          <DashboardWarningsModal>
            <Tooltip tooltip={t`Warnings for the Dashboard.`}>
              <a onClick={() => onOpenModal("DashboardWarningsModalComponent")}>
                <span>
                  {/* {item.ordered_cards[0].card.warnings.length} Warning(s) */}
                  {warningsLength} Warnings(s)
                </span>
              </a>
            </Tooltip>
          </DashboardWarningsModal>
        )}
      {modalOpen === "DashboardWarningsModalComponent" ? (
        <DashboardWarningsModalComponent
          item={item}
          onCloseModal={onCloseModal}
        />
      ) : null}
    </>
  );
}

export default DashboardWarnings;
