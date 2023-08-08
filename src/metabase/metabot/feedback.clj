(ns metabase.metabot.feedback
  (:require [cheshire.core :as json]
            [clj-http.client :as http]
            [metabase.analytics.snowplow :as snowplow]
            [metabase.api.common :as api]))

(def ^:private snowplow-keys [:entity_type :prompt_template_versions :feedback_type])
(def ^:private feedback-keys (into snowplow-keys [:prompt :sql]))

(defn- store-detailed-feedback
  "Store feedback details, including the original prompt and generated sql."
  [feedback]
  (println "====here====")
  (let [{:keys [status body]} (http/request
                               {:url              "https://data-platform-webhook.curefit.co/production/backend-datalake-kafka?EventName=metabot_feedback&KafkaTopicName=metabase_events"
                                :method           :post
                                :body             (json/generate-string
                                                   feedback
                                                   {:pretty true})
                                :headers          {:x-api-key "d1607bbb-8838-4d36-86d7-3f61bc736669"}
                                :throw-exceptions false
                                :as               :json
                                :accept           :json
                                :content-type     :json})]
    (when (= 200 status) body)))

(defn submit-feedback
  "Store user-generated feedback as both a concise value in snowplow
  and more detailed values in a separate endpoint."
  [feedback]
  (println feedback)
  (let [snowplow-feedback (select-keys feedback snowplow-keys)]
    (snowplow/track-event!
     ::snowplow/metabot-feedback-received api/*current-user-id*
     snowplow-feedback)
    (store-detailed-feedback feedback)))
