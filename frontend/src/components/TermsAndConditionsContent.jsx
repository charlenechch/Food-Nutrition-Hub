import React from "react";
import { useTranslation } from "react-i18next";
import "../css/PolicyContent.css";

export default function TermsAndConditionsContent() {
  const { t } = useTranslation();
  return (
    <div className="tpm-doc-body">
      <h3 className="tpm-doc-section">{t("termsAndConditions.s1Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s1Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s2Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s2Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s3Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s3Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s4Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s4Text1")}</p>
      <p className="tpm-doc-text">{t("termsAndConditions.s4Text2")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s5Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s5Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s6Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s6Text1")}</p>
      <p className="tpm-doc-text">{t("termsAndConditions.s6Text2")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s7Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s7Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s8Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s8Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s9Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s9Text1")}</p>
      <p className="tpm-doc-text">{t("termsAndConditions.s9Text2")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s10Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s10Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s11Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s11Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s12Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s12Text")}</p>

      <h3 className="tpm-doc-section">{t("termsAndConditions.s13Title")}</h3>
      <p className="tpm-doc-text">{t("termsAndConditions.s13Text1")}</p>
      <p className="tpm-doc-text">{t("termsAndConditions.s13Text2")}</p>
    </div>
  );
}