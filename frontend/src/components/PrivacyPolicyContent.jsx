import React from "react";
import { useTranslation } from "react-i18next";
import "../css/PolicyContent.css";

export default function PrivacyPolicyContent() {
   const { t } = useTranslation();
   return (
    <div className="tpm-doc-body">
      <h3 className="tpm-doc-section">{t("privacyPolicy.s1Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s1Text")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s2Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s2Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s2Text2")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s2Text3")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s3Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s3Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s3Text2")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s4Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s4Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s4Text2")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s5Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s5Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s5Text2")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s6Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s6Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s6Text2")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s6Text3")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s7Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s7Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s7Text2")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s8Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s8Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s8Text2")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s8Text3")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s9Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s9Text")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s10Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s10Text")}</p>

      <h3 className="tpm-doc-section">{t("privacyPolicy.s11Title")}</h3>
      <p className="tpm-doc-text">{t("privacyPolicy.s11Text1")}</p>
      <p className="tpm-doc-text">{t("privacyPolicy.s11Text2")}</p>
    </div>
  );
}