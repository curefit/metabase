import { t } from "ttag";

import MetabaseSettings from "metabase/lib/settings";
import validate from "metabase/lib/validate";

const FORM_FIELDS = [
  { name: "name", title: t`Name`, validate: validate.required() },
  {
    name: "description",
    title: t`Description`,
    type: "text",
    placeholder: t`It's optional but oh, so helpful`,
  },
];

export default {
  create: {
    fields: [
      ...FORM_FIELDS,
      {
        name: "collection_id",
        title: t`Collection`,
        type: "collection",
      },
    ],
  },
  edit: {
    fields: () => {
      const fields = [...FORM_FIELDS];
      if (
        MetabaseSettings.get("enable-query-caching")
        // PLUGIN_CACHING.cacheTTLFormField
      ) {
        fields.push({
          name: "cache_ttl",
          title: t`Caching`,
          type: "number",
          placeholder: t`Cache TTL in Hours`,
        });
      }
      return fields;
    },
  },
};
