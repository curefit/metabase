import React, { useState } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import _ from "underscore";
import Modal from "metabase/components/Modal";
import ModalContent from "metabase/components/ModalContent";
import Collapsible from "metabase/components/Collapsable";

const propTypes = {
  item: PropTypes.object.isRequired,
  onCloseModal: PropTypes.object.isRequired,
};

function getWarnings(item) {
  const warnings = {};
  let archive = 0;
  item.ordered_cards.forEach(orderedCard => {
    const cardWarnings = orderedCard.card.warnings || [];
    cardWarnings.forEach(warningsByCard => {
      if (warningsByCard?.archive) {
        archive = archive + 1;
      }
      const cardWarningsList = warningsByCard?.warnings || [];
      cardWarningsList.forEach(eachWarning => {
        if (eachWarning?.warningCode?.name) {
          warnings[eachWarning.warningCode.name] =
            warnings[eachWarning.warningCode.name] || [];
          warnings[eachWarning.warningCode.name].push({
            cardName: orderedCard.card.name,
            warning: eachWarning.message,
          });
        }
      });
    });
  });
  return [warnings, archive];
}

function DashboardWarningsModalComponent({ item, onCloseModal }) {
  const modalTitle = t`Warnings for the Dashboard`;

  const [modalInputOpen, setModalInputOpen] = useState(
    "DashboardWarningsModalComponent",
  );

  function onCloseInputModal(propTypes) {
    setModalInputOpen(null);
    onCloseModal(null);
  }

  const [warningsByCode, archive] = getWarnings(item);

  return (
    <>
      {modalInputOpen === "DashboardWarningsModalComponent" ? (
        <Modal onClose={onCloseInputModal}>
          <ModalContent title={modalTitle} onClose={onCloseInputModal}>
            {Object.entries(warningsByCode).map(([code, messages]) => (
              <div key={code}>
                <Collapsible open={false} title={code}>
                  {warningsByCode[code].length > 0 ? (
                    code === "PARTITION_NOT_USED" ? (
                      <table className="ContentTable">
                        <thead>
                          <tr>
                            <th>Card Name</th>
                            <th>Message</th>
                            <th>Available Partitions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warningsByCode[code].map((warning, index) => {
                            const partitionColumns = warning.warning.split(
                              "Available partition columns are: ",
                            )[1];
                            const columnsArray = partitionColumns
                              .replace(/"/g, "")
                              .replace("[", "")
                              .replace("]", "")
                              .split(",");
                            return (
                              <tr key={index}>
                                <td>{warning.cardName}</td>
                                <td>
                                  {
                                    warning.warning.split(
                                      "Available partition columns are: ",
                                    )[0]
                                  }
                                </td>
                                <td>
                                  {columnsArray.map((column, index) => (
                                    <div key={index}>{column}</div>
                                  ))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <ul>
                        <table className="ContentTable">
                          <thead>
                            <tr>
                              <th>Card Name</th>
                              <th>Message</th>
                            </tr>
                          </thead>
                          {warningsByCode[code].map((warning, index) => (
                            <tbody key={index}>
                              <tr key={`warning-${index}`}>
                                <td>{warning.cardName}</td>
                                <td>{warning.warning}</td>
                              </tr>
                            </tbody>
                          ))}
                        </table>
                      </ul>
                    )
                  ) : (
                    <p>No warnings found for this category.</p>
                  )}
                </Collapsible>
              </div>
            ))}
            <hr />
            {archive > 0 ? (
              <p style={{ fontWeight: "bold", color: "#ED6E6E" }}>
                Your Dashboard will be archived in 7 days, if no Action is
                taken. Please contact analytics-tech@curefit.com.
              </p>
            ) : null}
          </ModalContent>
        </Modal>
      ) : null}
    </>
  );
}

DashboardWarningsModalComponent.propTypes = propTypes;

export default DashboardWarningsModalComponent;
