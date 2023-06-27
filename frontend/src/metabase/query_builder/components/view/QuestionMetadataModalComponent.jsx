import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import ModalContent from "metabase/components/ModalContent";
import Modal from "metabase/components/Modal";
import TextSideBar from "metabase/components/TextSideBar";
import AceEditor from "metabase/components/TextEditor";

const propTypes = {
  question: PropTypes.object.isRequired, // metabase-lib Question instance
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
};

function QuestionMetadataModalComponent({ question, onClose }) {
  const modalTitle = t`AI Assistant`;
  const [isExplainLoading, setIsExplainLoading] = useState(true);
  const [isOptimiseLoading, setIsOptimiseLoading] = useState(null);
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState("explain");
  const [optimizerResponse, setOptimizerResponse] = useState(null);

  useEffect(() => {
    async function fetchData() {
      console.log("called fetchData");
      try {
        const resultMetadata = question._card.result_metadata;
        const metadataArray =
          resultMetadata && Array.isArray(resultMetadata)
            ? resultMetadata.map(({ name, base_type }) => ({ name, base_type }))
            : [];

        const response = await question.queryExplain(
          question._card.id,
          question._card.dataset_query.native.query,
          metadataArray,
          question._card.dataset_query.database,
        );
        setResponse(response);
      } catch (error) {
        console.error("Error occurred while fetching data:", error);
      } finally {
        setIsExplainLoading(false);
      }
    }

    fetchData();
  }, [question]);

  const handleItemClick = item => {
    setActiveTab(item);
  };

  async function optimiseFunction() {
    try {
      setIsOptimiseLoading(true);
      const resultMetadata = question._card.result_metadata;
      const metadataArray =
        resultMetadata && Array.isArray(resultMetadata)
          ? resultMetadata.map(({ name, base_type }) => ({ name, base_type }))
          : [];
      const warningsArray =
        question &&
        question._card &&
        question._card.warnings &&
        question._card.warnings.length > 0 &&
        question._card.warnings.some(warning => warning !== null)
          ? question._card.warnings[0].warnings
          : null;
      const optimiseResponse = await question.queryOptimise(
        question._card.id,
        question._card.dataset_query.native.query,
        metadataArray,
        question._card.dataset_query.database,
        warningsArray,
      );
      setOptimizerResponse(optimiseResponse);
    } catch (error) {
      console.error("Error occurred while fetching data:", error);
    } finally {
      setIsOptimiseLoading(false);
    }
  }

  return (
    <Modal wide>
      <ModalContent title={modalTitle} centeredTitle={true} onClose={onClose}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "25px",
          }}
        >
          <div>
            <TextSideBar
              name="Step-by-step explanation of Query's Logic"
              icon="document"
              onClick={() => handleItemClick("explain")}
              active={activeTab === "explain"}
            />
            <TextSideBar
              name="Suggestions to Optimise your SQL Query"
              icon="sql"
              onClick={() => {
                handleItemClick("optimise");
                optimiseFunction();
              }}
              active={activeTab === "optimise"}
            />
          </div>
          {activeTab === "explain" ? (
            <>
              {activeTab === "explain" ? (
                <>
                  {isExplainLoading ? (
                    <div>Loading...</div> // Replace with your loading symbol/component
                  ) : (
                    <div style={{ overflow: "auto" }}>
                      {response && response.output.includes("Summary:") ? (
                        <>
                          <pre
                            style={{
                              whiteSpace: "pre-wrap",
                              fontFamily: "inherit",
                              fontWeight: "normal",
                              lineHeight: "1.4",
                              marginTop: "10px",
                            }}
                          >
                            <b>Summary:</b>{" "}
                            {response.output.split("Summary:")[1]}
                          </pre>
                          <pre
                            style={{
                              whiteSpace: "pre-wrap",
                              fontFamily: "inherit",
                              fontWeight: "normal",
                              lineHeight: "1.4",
                            }}
                          >
                            {response &&
                              response.output.includes("Summary:") &&
                              response.output
                                .split("Summary:")[0]
                                .split("\n")
                                .map((line, index) => (
                                  <span
                                    key={index}
                                    style={{
                                      fontWeight: /^[a-zA-Z]/.test(line)
                                        ? "bold"
                                        : "normal",
                                    }}
                                  >
                                    {line}
                                    <br />
                                  </span>
                                ))}
                          </pre>
                        </>
                      ) : (
                        <div>
                          {response.response_id === 200 ? (
                            <pre
                              style={{
                                whiteSpace: "pre-wrap",
                                fontFamily: "inherit",
                                fontWeight: "normal",
                                lineHeight: "1.4",
                              }}
                            >
                              {response.output}
                            </pre>
                          ) : (
                            <pre
                              style={{
                                whiteSpace: "pre-wrap",
                                fontFamily: "inherit",
                                fontWeight: "normal",
                                lineHeight: "1.4",
                              }}
                            >
                              Error in Response: {response.output}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isOptimiseLoading ? (
                    <div>Loading...</div> // Replace with your loading symbol/component
                  ) : (
                    <div style={{ overflow: "auto", maxHeight: "700px" }}>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          fontWeight: "normal",
                          lineHeight: "1.4",
                        }}
                      >
                        {/* Your rendering logic for optimizerResponse */}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {isOptimiseLoading ? (
                <div>Loading...</div> // Replace with your loading symbol/component
              ) : (
                <div style={{ overflow: "auto", maxHeight: "700px" }}>
                  {optimizerResponse &&
                  optimizerResponse.output &&
                  optimizerResponse.output.includes("```sql") ? (
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        fontFamily: "inherit",
                        fontWeight: "normal",
                        lineHeight: "1.4",
                      }}
                    >
                      {optimizerResponse.output
                        .split("```sql")
                        .map((part, index, array) => {
                          if (index % 2 === 0) {
                            return (
                              <span
                                key={index}
                                style={{ fontWeight: "normal" }}
                              >
                                {part}
                                <br />
                              </span>
                            );
                          } else {
                            const sqlQuery = part.trim().split("```")[0]; // Extract the SQL query and remove backticks

                            return (
                              <>
                                <AceEditor
                                  className="z1"
                                  value={sqlQuery}
                                  mode="text"
                                  wrapEnabled={true}
                                  fontSize={12}
                                  theme="ace/theme/metabase"
                                  setOptions={{
                                    behavioursEnabled: false,
                                    indentedSoftWrap: false,
                                    minLines: 1,
                                    maxLines: 20,
                                    showLineNumbers: false,
                                    showGutter: false,
                                    showFoldWidgets: false,
                                    showPrintMargin: false,
                                  }}
                                  readOnly
                                />
                                {index === array.length - 1 && (
                                  <span key={index + 1}>
                                    {optimizerResponse.output.substring(
                                      optimizerResponse.output.lastIndexOf(
                                        "```",
                                      ) + 3,
                                    )}
                                  </span>
                                )}
                              </>
                            );
                          }
                        })}
                    </pre>
                  ) : (
                    <div>
                      {optimizerResponse.response_id === 200 ? (
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "inherit",
                            fontWeight: "normal",
                            lineHeight: "1.4",
                          }}
                        >
                          {optimizerResponse.output}
                        </pre>
                      ) : (
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "inherit",
                            fontWeight: "normal",
                            lineHeight: "1.4",
                          }}
                        >
                          Error in Response: {optimizerResponse.output}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

QuestionMetadataModalComponent.propTypes = propTypes;

export default QuestionMetadataModalComponent;
