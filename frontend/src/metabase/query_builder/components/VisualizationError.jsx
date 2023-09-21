/* eslint "react/prop-types": "warn" */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import { getIn } from "icepick";
import cx from "classnames";

import MetabaseSettings from "metabase/lib/settings";
import ErrorMessage from "metabase/components/ErrorMessage";
import ErrorDetails from "metabase/components/ErrorDetails/ErrorDetails";
import {
  QueryError,
  QueryErrorHeader,
  QueryErrorIcon,
  QueryErrorTitle,
  QueryErrorLink,
  QueryErrorMessage,
  QueryErrorContent,
} from "./VisualizationError.styled";

const EmailAdmin = () => {
  const adminEmail = MetabaseSettings.adminEmail();
  return (
    adminEmail && (
      <span className="QueryError-adminEmail">
        <a className="no-decoration" href={`mailto:${adminEmail}`}>
          {adminEmail}
        </a>
      </span>
    )
  );
};

export function adjustPositions(error, origSql) {
  /* Positions in error messages are borked coming in for Postgres errors.
   * Previously, you would see "blahblahblah bombed out, Position: 119" in a 10-character invalid query.
   * This is because MB shoves in 'remarks' into the original query and we get the exception from the query with remarks.
   * This function adjusts the value of the positions in the exception message to account for this.
   * This is done in mildly scary kludge here in frontend after everything,
   * because the alternative of doing it in backend
   * is an absolutely terrifying kludge involving messing with exceptions.
   */
  let adjustmentLength = 0;

  // redshift remarks use c-style multiline comments...
  const multiLineBeginPos = origSql.search("/\\*");
  const multiLineEndPos = origSql.search("\\*/");
  // if multiLineBeginPos is 0 then we know it's a redshift remark
  if (multiLineBeginPos === 0 && multiLineEndPos !== -1) {
    adjustmentLength += multiLineEndPos + 2; // 2 for */ in itself
  }

  const chompedSql = origSql.substr(adjustmentLength);
  // there also seem to be cases where remarks don't get in...
  const commentPos = chompedSql.search("--");
  const newLinePos = chompedSql.search("\n");
  // 5 is a heuristic: this indicates that this is almost certainly an initial remark comment
  if (commentPos !== -1 && commentPos < 5) {
    // There will be a \n after the redshift comment,
    // which is why there needs to be a 2 added
    adjustmentLength += newLinePos + 2;
  }

  return error.replace(/Position: (\d+)/, function (_, p1) {
    return "Position: " + (parseInt(p1) - adjustmentLength);
  });
}

export function stripRemarks(error) {
  /* SQL snippets in error messages are borked coming in for errors in many DBs.
   * You're expecting something with just your sql in the message,
   * but the whole error contains these remarks that MB added in. Confusing!
   */
  return error.replace(
    /-- Metabase:: userID: \d+ queryType: native queryHash: \w+\n/,
    "",
  );
}

class VisualizationError extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showError: false,
    };
  }
  static propTypes = {
    via: PropTypes.object.isRequired,
    card: PropTypes.object.isRequired,
    duration: PropTypes.number.isRequired,
    error: PropTypes.object.isRequired,
    className: PropTypes.string,
  };  

  render() {    
    const { via, card, duration, error, className } = this.props;
    console.log("error", error);

  //   const warnings = [
  //     {
  //         "id": 14661824,
  //         "cardId": 32683,
  //         "warnings": [
  //             {
  //                 "warningCode": {
  //                     "code": -1,
  //                     "name": "PARTITION_NOT_USED"
  //                 },
  //                 "message": "Partition not used for pk_cfprodplatforms_rashi.user_event.Available partition columns are: [\"createddate_date\"]"
  //             },
  //             {
  //                 "warningCode": {
  //                     "code": -1,
  //                     "name": "HIGH_CUMULATIVE_MEMORY_USAGE"
  //                 },
  //                 "message": "Optimize query to reduce memory usage"
  //             }
  //         ],
  //         "queryHash": "61564dfdde0e98b05f10be952cd42a9906158b67312a588b381cefc32c1bc905",
  //         "executionStartTime": "2023-09-19T06:00:00.969+0000",
  //         "tables": [
  //             "pk_cfprodplatforms_rashi.user_event"
  //         ],
  //         "archive": true
  //     }
  // ]

  //   console.log("======error=======");
  //   console.log(card);

  //   card.warnings = warnings;

  //   if(card.warnings?.warnings?.warningCode?.name === "PARTITION_NOT_USED") {
  //     error = "You've not used Partitions Keys in your Query, Please fix the SQL Query to get the results."
  //   }

    if (error && typeof error.status === "number") {
      // Assume if the request took more than 15 seconds it was due to a timeout
      // Some platforms like Heroku return a 503 for numerous types of errors so we can't use the status code to distinguish between timeouts and other failures.
      if (duration > 15 * 1000) {
        return (
          <ErrorMessage
            className={className}
            type="timeout"
            title={t`Your question took too long`}
            message={t`We didn't get an answer back from your database in time, so we had to stop. You can try again in a minute, or if the problem persists, you can email an admin to let them know.`}
            action={<EmailAdmin />}
          />
        );
      } else {
        return (
          <ErrorMessage
            className={className}
            type="serverError"
            title={t`We're experiencing server issues`}
            message={t`Try refreshing the page after waiting a minute or two. If the problem persists we'd recommend you contact an admin.`}
            action={<EmailAdmin />}
          />
        );
      }
    } else if (error instanceof Error) {
      return (
        <div className={cx(className, "QueryError2 flex justify-center")}>
          <div className="QueryError-image QueryError-image--queryError mr4" />
          <div className="QueryError2-details">
            <h1 className="text-bold">{t`There was a problem with this visualization`}</h1>
            <ErrorDetails className="pt2" details={error} />
          </div>
        </div>
      );
    } else if (
      card &&
      card.dataset_query &&
      card.dataset_query.type === "native"
    ) {
      // always show errors for native queries
      let processedError = error;
      const origSql = getIn(via, [(via || "").length - 1, "ex-data", "sql"]);
      if (typeof error === "string" && typeof origSql === "string") {
        processedError = adjustPositions(error, origSql);
      }
      if (typeof error === "string") {
        processedError = stripRemarks(processedError);
      }
      return (
        <QueryError className={className}>
          <QueryErrorContent>
            <QueryErrorHeader>
              <QueryErrorIcon name="warning" />
              <QueryErrorTitle>{t`An error occurred in your query`}</QueryErrorTitle>
            </QueryErrorHeader>
            <QueryErrorMessage>{processedError}</QueryErrorMessage>
            <QueryErrorLink
              href={MetabaseSettings.learnUrl("debugging-sql/sql-syntax")}
            >
              {t`Learn how to debug SQL errors`}
            </QueryErrorLink>
          </QueryErrorContent>
        </QueryError>
      );
    } else {
      return (
        <div className={cx(className, "QueryError2 flex justify-center")}>
          <div className="QueryError-image QueryError-image--queryError mr4" />
          <div className="QueryError2-details">
            <h1 className="text-bold">{t`There was a problem with your question`}</h1>
            <p className="QueryError-messageText">{t`Most of the time this is caused by an invalid selection or bad input value. Double check your inputs and retry your query.`}</p>
            <ErrorDetails className="pt2" details={error} />
          </div>
        </div>
      );
    }
  }
}

export default VisualizationError;
