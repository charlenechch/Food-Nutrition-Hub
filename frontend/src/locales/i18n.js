import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en/common.json";
import ms from "./ms/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ms: { common: ms }
    },
    lng: "en",
    fallbackLng: "en",

    ns: ["common"],        // 👈 tell i18next to use namespace "common"
    defaultNS: "common",

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
