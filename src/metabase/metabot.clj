(ns metabase.metabot
  "The core metabot namespace. Consists primarily of functions named infer-X,
  where X is the thing we want to extract from the bot response."
  (:require
    [cheshire.core :as json]
    [clojure.string :as str]
    [metabase.api.common :as api]
    [metabase.config :as config]
    [cheshire.core :as json]
    [clj-http.client :as client]
    [metabase.lib.native :as lib-native]
    [metabase.metabot.client :as metabot-client]
    [metabase.metabot.settings :as metabot-settings]
    [metabase.metabot.util :as metabot-util]
    [metabase.models :refer [Table]]
    [metabase.util.log :as log]
    [toucan2.core :as t2]
    [toucan.db :as db]))

(defn infer-viz
  "Determine an 'interesting' visualization for this data."
  [{sql :sql :as context}]
  (log/infof "Metabot is inferring visualization for sql '%s'." sql)
  (if (metabot-settings/is-metabot-enabled)
    (if (metabot-util/select-all? sql)
      ;; A SELECT * query just short-circuits to a tabular display
      {:template {:display                :table
                  :visualization_settings {}}}
      ;; More interesting SQL merits a more interesting display
      (let [{:keys [prompt_template version] :as prompt} (metabot-util/create-prompt context)]
        {:template                (metabot-util/find-result
                                    (fn [message]
                                      (metabot-util/response->viz
                                        (json/parse-string message keyword)))
                                    (metabot-client/invoke-metabot prompt))
         :prompt_template_version (format "%s:%s" prompt_template version)}))
    (log/warn "Metabot is not enabled")))

(defn infer-sql
  "Given a model and prompt, attempt to generate a native dataset."
  [{:keys [model user_prompt] :as context}]
  (log/infof "Metabot is inferring sql for model '%s' with prompt '%s'." (:id model) user_prompt)
  (if (metabot-settings/is-metabot-enabled)
    (let [{:keys [prompt_template version] :as prompt} (metabot-util/create-prompt context)
          {:keys [database_id inner_query]} model]
      (if-some [bot-sql (metabot-util/find-result
                          metabot-util/extract-sql
                          (metabot-client/invoke-metabot prompt))]
        (let [final-sql     (metabot-util/bot-sql->final-sql model bot-sql)
              _             (log/infof "Inferred sql for model '%s' with prompt '%s':\n%s"
                                       (:id model)
                                       user_prompt
                                       final-sql)
              template-tags (lib-native/template-tags inner_query)
              dataset       {:dataset_query          {:database database_id
                                                      :type     "native"
                                                      :native   {:query         final-sql
                                                                 :template-tags template-tags}}
                             :display                :table
                             :visualization_settings {}}]
          {:card                     dataset
           :prompt_template_versions (vec
                                       (conj
                                         (:prompt_template_versions model)
                                         (format "%s:%s" prompt_template version)))
           :bot-sql                  bot-sql})
        (log/infof "No sql inferred for model '%s' with prompt '%s'." (:id model) user_prompt)))
    (log/warn "Metabot is not enabled")))

(defn get-watson-query [sql ddl metrics segments enums user_prompt engine]
  (try
    (let [url (str (config/config-str :mb-watson-backend) "api/v1/query_validator")
          request-body {:query sql :ddl ddl :metrics metrics :segments segments :enums enums :user_promt user_prompt :engine engine}]
      (println "==============Watson API Call===============")
      (println "API URL:" url)

      (let [response (client/post url
                                  {:body (json/generate-string request-body)
                                   :content-type :json
                                   :socket-timeout 20000
                                   :conn-timeout 20000
                                   :conn-request-timeout 20000})]
        (println (json/parse-string (:body response)))
        (if (= (get-in (json/parse-string (:body response)) ["response_id"]) 200)
          (get-in (json/parse-string (:body response)) ["output"])
          sql)))
    (catch java.net.SocketTimeoutException e
      (println "Error: Request timed out")
      sql)
    (catch Throwable e
      (println "Error occurred while calling API: " (.getMessage e))
      sql)))

(defn infer-db-native-sql-query
  "Given a database and user prompt, determine a sql query to answer my question."
  [{{database-id :id schema-name :schema db-name :name dbms-version :dbms_version details :details} :database
    :keys             [user_prompt prompt_template_versions] :as context}
   table_id]
  (log/infof "Metabot is inferring sql for database '%s' with prompt '%s'." database-id user_prompt)
  (if (metabot-settings/is-metabot-enabled)
    (let [selected_schema    (db/select-one-field :schema Table :id table_id)
          tables         (t2/select Table {:union-all [{:select [:t.name :t.schema :t.id :t.db_id]
                                                        :from [[:metabase_table :t]]
                                                        :where [:and [:= :t.id table_id]
                                                                [:= :active true]
                                                                [:= :visibility_type nil]]}
                                                       {:select [:mt2.name :mt2.schema :mt2.id :mt2.db_id]
                                                        :from [[:metabase_table :mt]]
                                                        :join [[:metabase_field :mf] [:= :mf.table_id :mt.id]
                                                               [:metabase_field :mf2] [:= :mf.fk_target_field_id :mf2.id]
                                                               [:metabase_table :mt2] [:= :mt2.id :mf2.table_id]]
                                                        :where [:and [:= :mt.id table_id]
                                                                [:= :mt.active true]
                                                                [:= :mt.visibility_type nil]]
                                                        }]})
          prompt-objects (->> tables
                              (map metabot-util/memoized-create-table-embedding)
                              (filter identity)
                              distinct)
          enum-prompt-objects   (->> prompt-objects
                                    (map metabot-util/memoized-enums-embedding)
                                    (mapcat identity))
          metric-prompt-objects (->> prompt-objects
                                    (map metabot-util/memoized-metrics-embedding)
                                    (mapcat identity))
          segment-prompt-objects (->> prompt-objects
                                     (map metabot-util/memoized-segments-embedding)
                                      (mapcat identity))
          ddl            (metabot-util/generate-prompt prompt-objects user_prompt)
          metrics        (metabot-util/generate-prompt metric-prompt-objects user_prompt)
          segments       (metabot-util/generate-prompt segment-prompt-objects user_prompt)
          enums          (metabot-util/generate-prompt enum-prompt-objects user_prompt)
          context        (assoc-in context [:database :create_database_ddl] ddl)
          context        (assoc-in context [:database :metrics] metrics)
          context        (assoc-in context [:database :segments] segments)
          context        (assoc-in context [:database :enums] enums)
          context        (assoc-in context [:database :schema]
                                   (if selected_schema selected_schema (if (:dbname details) (:dbname details) db-name)))
          context        (assoc-in context [:database :engine] (:flavor dbms-version))
          {:keys [prompt_template version] :as prompt} (metabot-util/create-prompt context)]
      (if-some [sql (metabot-util/find-result
                      metabot-util/extract-sql
                      (metabot-client/invoke-metabot prompt))]
        (let [watson-sql    (get-watson-query sql ddl metrics segments enums user_prompt (:flavor dbms-version))
              template-tags {}
              dataset       {:dataset_query          {:database database-id
                                                      :type     "native"
                                                      :native   {:query         watson-sql
                                                                 :template-tags template-tags}}
                             :display                :table
                             :visualization_settings {}}]
         {:card                     dataset
         :prompt_template_versions (vec
                                     (conj
                                       (vec prompt_template_versions)
                                       (format "%s:%s" prompt_template version)))
         :bot-sql                  sql})
        (log/infof "No sql inferred for database '%s' with prompt '%s'." database-id user_prompt)))
    (log/warn "Metabot is not enabled")))

(defn match-best-model
  "Find the model in the db that best matches the prompt using embedding matching."
  [{{database-id :id :keys [models]} :database :keys [user_prompt]}]
  (log/infof "Metabot is inferring model for database '%s' with prompt '%s'." database-id user_prompt)
  (if (metabot-settings/is-metabot-enabled)
    (let [models (->> models
                      (map (fn [{:keys [create_table_ddl] :as model}]
                             (let [{:keys [prompt embedding tokens]} (metabot-client/create-embedding create_table_ddl)]
                               (assoc model
                                 :prompt prompt
                                 :embedding embedding
                                 :tokens tokens)))))]
      (if-some [{best-mode-name :name
                 best-model-id  :id
                 :as            model} (metabot-util/best-prompt-object models user_prompt)]
        (do
          (log/infof "Metabot selected best model for database '%s' with prompt '%s' as '%s' (%s)."
                     database-id user_prompt best-model-id best-mode-name)
          model)
        (log/infof "No model inferred for database '%s' with prompt '%s'." database-id user_prompt)))
    (log/warn "Metabot is not enabled")))

(defn infer-model
  "Find the model in the db that best matches the prompt. Return nil if no good model found."
  [{{database-id :id :keys [models]} :database :keys [user_prompt] :as context}]
  (log/infof "Metabot is inferring model for database '%s' with prompt '%s'." database-id user_prompt)
  (if (metabot-settings/is-metabot-enabled)
    (let [{:keys [prompt_template version] :as prompt} (metabot-util/create-prompt context)
          ids->models   (zipmap (map :id models) models)
          candidates    (set (keys ids->models))
          best-model-id (metabot-util/find-result
                          (fn [message]
                            (some->> message
                                     (re-seq #"\d+")
                                     (map parse-long)
                                     (some candidates)))
                          (metabot-client/invoke-metabot prompt))]
      (if-some [model (ids->models best-model-id)]
        (do
          (log/infof "Metabot selected best model for database '%s' with prompt '%s' as '%s'."
                     database-id user_prompt best-model-id)
          (update model
                  :prompt_template_versions
                  (fnil conj [])
                  (format "%s:%s" prompt_template version)))
        (log/infof "No model inferred for database '%s' with prompt '%s'." database-id user_prompt)))
    (log/warn "Metabot is not enabled")))

(defn infer-native-sql-query
  "Given a database and user prompt, determine a sql query to answer my question."
  [{{database-id :id metabot_schema :metabot_schema
     dbms-version :dbms_version details :details db-name :name} :database
    :keys             [user_prompt prompt_template_versions] :as context}]
  (log/infof "Metabot is inferring sql for database '%s' with prompt '%s'." database-id user_prompt)
  (if (metabot-settings/is-metabot-enabled)
    (let [prompt-objects (->> (if metabot_schema
                                (t2/select [Table :name :schema :id :db_id] :db_id database-id
                                         :schema [:in (set (str/split metabot_schema #","))]
                                         :active true :visibility_type nil)
                                (t2/select [Table :name :schema :id :db_id] :db_id database-id
                                           :active true :visibility_type nil))
                              (map metabot-util/memoized-create-table-embedding)
                              (filter identity))
          enum-prompt-objects   (->> prompt-objects
                                     (map metabot-util/memoized-enums-embedding)
                                     (mapcat identity))
          metric-prompt-objects (->> prompt-objects
                                     (map metabot-util/memoized-metrics-embedding)
                                     (mapcat identity))
          segment-prompt-objects (->> prompt-objects
                                      (map metabot-util/memoized-segments-embedding)
                                      (mapcat identity))
          ddl            (metabot-util/generate-prompt prompt-objects user_prompt)
          metrics        (metabot-util/generate-prompt metric-prompt-objects user_prompt)
          segments       (metabot-util/generate-prompt segment-prompt-objects user_prompt)
          enums          (metabot-util/generate-prompt enum-prompt-objects user_prompt)
          context        (assoc-in context [:database :create_database_ddl] ddl)
          context        (assoc-in context [:database :metrics] metrics)
          context        (assoc-in context [:database :segments] segments)
          context        (assoc-in context [:database :enums] enums)
          context        (assoc-in context [:database :schema]
                                   (if metabot_schema metabot_schema (if (:dbname details) (:dbname details) db-name)))
          context        (assoc-in context [:database :engine] (:flavor dbms-version))
          {:keys [prompt_template version] :as prompt} (metabot-util/create-prompt context)]
      (if-some [sql (metabot-util/find-result
                      metabot-util/extract-sql
                      (metabot-client/invoke-metabot prompt))]
        {:sql                      (get-watson-query sql ddl metrics segments enums user_prompt (:flavor dbms-version))
         :prompt_template_versions (conj
                                     (vec prompt_template_versions)
                                     (format "%s:%s" prompt_template version))}
        (log/infof "No sql inferred for database '%s' with prompt '%s'." database-id user_prompt)))
    (log/warn "Metabot is not enabled")))
