import React from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import _ from "underscore";
import ModalContent from "metabase/components/ModalContent";
import Collapsible from "metabase/components/Collapsable";

const propTypes = {
  question: PropTypes.object.isRequired, // metabase-lib Question instance
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
};

function QuestionWarningsModalComponent({ question, onClose }) {
  const modalTitle = t`Warnings for the Card`;
  let archive = 0;
  const warningsByCode = question._card.warnings.reduce(
    (accumulator, currentWarning) => {
      const { warnings } = currentWarning;
      if (currentWarning.archive) {
        archive = archive + 1;
      }
      warnings.forEach(warning => {
        const { warningCode, message } = warning;
        const { name } = warningCode;
        if (!accumulator[name]) {
          accumulator[name] = [];
        }
        accumulator[name].push(message);
      });
      return accumulator;
    },
    {},
  );

  return (
    <>
      <ModalContent title={modalTitle} onClose={onClose}>
        {Object.entries(warningsByCode).map(([code, messages]) => (
          <div key={code}>
            <Collapsible open={false} title={code}>
              {code === "PARTITION_NOT_USED" ? (
                <table className="ContentTable">
                  <thead>
                    <tr>
                      <th>Message</th>
                      <th>Available Partitions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message, index) => {
                      const partitionColumns = message.split(
                        "Available partition columns are: ",
                      )[1];
                      const columnsArray = partitionColumns
                        .replace(/"/g, "")
                        .replace("[", "")
                        .replace("]", "")
                        .split(",");
                      return (
                        <tr key={index}>
                          <td>
                            {
                              message.split(
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
                  {messages.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              )}
            </Collapsible>
          </div>
        ))}
        <hr />
        {archive > 0 ? (
          <p style={{ fontWeight: "bold", color: "#ED6E6E" }}>
            Your card will be archived in 7 days, if no Action is taken. Please
            contact analytics-tech@curefit.com.
          </p>
        ) : null}
      </ModalContent>
    </>
  );
}

QuestionWarningsModalComponent.propTypes = propTypes;

export default QuestionWarningsModalComponent;
