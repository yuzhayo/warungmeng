import "i18next";
import type { idTranslations } from "./translations";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    returnNull: false;
    keySeparator: false;
    resources: {
      translation: typeof idTranslations;
    };
  }
}
