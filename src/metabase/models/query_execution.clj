(ns metabase.models.query-execution
  "QueryExecution is a log of very time a query is executed, and other information such as the User who executed it, run
  time, context it was executed in, etc."
  (:require [metabase.mbql.schema :as mbql.s]
            [metabase.util :as u]
            [metabase.util.i18n :refer [tru]]
            [schema.core :as s]
            [toucan.db :as db]
            [toucan.models :as models]))

(models/defmodel QueryExecution :query_execution)

(def ^:private ^{:arglists '([context])} validate-context
  (s/validator mbql.s/Context))

(defn- pre-insert [{context :context, :as query-execution}]
  (u/prog1 query-execution
    (validate-context context)))

(defn- post-select [{:keys [result_rows] :as query-execution}]
  ;; sadly we have 2 ways to reference the row count :(
  (assoc query-execution :row_count (or result_rows 0)))

(u/strict-extend (class QueryExecution)
  models/IModel
  (merge models/IModelDefaults
         {:types       (constantly {:json_query :json, :status :keyword, :context :keyword})
          :pre-insert  pre-insert
          :pre-update  (fn [& _] (throw (Exception. (tru "You cannot update a QueryExecution!"))))
          :post-select post-select}))


(defn get-result-rows
  "Fetch the result rows for query with QUERY-HASH if available.
   Returns `nil` if no information is available."
  ^Integer [^bytes query-hash]
  {:pre [(instance? (Class/forName "[B") query-hash)]}
  (if (some? (db/select-one-field :result_rows QueryExecution :hash query-hash {:order-by [[:started_at :desc]]}))
    (db/select-one-field :result_rows QueryExecution :hash query-hash {:order-by [[:started_at :desc]]})
    6000))
