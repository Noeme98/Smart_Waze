import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthPages";
import { useTranslation } from "../../i18n/useTranslation";
import Step1Issue from "./Step1Issue";
import Step2Location from "./Step2Location";
import Step3Evidence from "./Step3Evidence";
import { reportAPI } from "../../services/api";
import Toast from "../../components/Toast";

const DRAFT_KEY = "smartwayz_report_draft_v1";

const initialFormData = {
  issueTitle: "",
  reportType: "",
  categoryId: null,
  subcategory: "",
  subcategoryId: null,
  category: "",
  otherCategory: "",
  description: "",
  location: "",
  latitude: null,
  longitude: null,
  landmark: "",
  images: [],
  contactInfo: "",
  errors: {},
};

function serializeDraft(formData, step) {
  return {
    step,
    issueTitle: formData.issueTitle ?? "",
    reportType: formData.reportType ?? "",
    categoryId: formData.categoryId ?? null,
    subcategory: formData.subcategory ?? "",
    subcategoryId: formData.subcategoryId ?? null,
    category: formData.category ?? "",
    otherCategory: formData.otherCategory ?? "",
    description: formData.description ?? "",
    location: formData.location ?? "",
    latitude: formData.latitude ?? null,
    longitude: formData.longitude ?? null,
    landmark: formData.landmark ?? "",
    contactInfo: formData.contactInfo ?? "",
  };
}

const ReportForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const steps = useMemo(
    () => [t("reportForm.step1"), t("reportForm.step2"), t("reportForm.step3")],
    [t]
  );
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [toast, setToast] = useState(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === "object") {
          const { step: savedStep, ...rest } = d;
          setStep(typeof savedStep === "number" && savedStep >= 1 && savedStep <= 3 ? savedStep : 1);
          setFormData({
            ...initialFormData,
            ...rest,
            images: [],
            errors: {},
          });
          setDraftRestored(true);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady || !isAuthenticated) return;
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(serializeDraft(formData, step)));
      } catch {
        /* quota / private mode */
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [formData, step, isAuthenticated, draftReady]);

  const clearDraftStorage = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const discardDraft = useCallback(() => {
    clearDraftStorage();
    setFormData(initialFormData);
    setStep(1);
    setDraftRestored(false);
    setSubmitError(null);
  }, [clearDraftStorage]);

  const validateStep = useCallback(
    (currentStep) => {
      const newErrors = {};

      if (currentStep === 1) {
        if (!formData.issueTitle.trim()) {
          newErrors.issueTitle = t("reportForm.errors.issueTitle");
        }
        if (!formData.reportType) {
          newErrors.reportType = t("reportForm.errors.reportType");
        }
        if (!formData.subcategory) {
          newErrors.category = t("reportForm.errors.category");
        }
        if ((formData.category?.includes("Other") || formData.category?.includes("specify")) && !formData.otherCategory?.trim()) {
          newErrors.otherCategory = t("reportForm.errors.otherCategory");
        }
      } else if (currentStep === 2) {
        if (!formData.latitude || !formData.longitude) {
          newErrors.location = t("reportForm.errors.location");
        }
      } else if (currentStep === 3) {
        if (!formData.images || formData.images.length === 0) {
          newErrors.images = t("reportForm.errors.images");
        }
      }

      setFormData((prev) => ({ ...prev, errors: newErrors }));
      return Object.keys(newErrors).length === 0;
    },
    [formData, t]
  );

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      errors: {
        ...prev.errors,
        [field]: undefined,
      },
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) {
      return;
    }

    if (!isAuthenticated || !user) {
      setSubmitError(t("reportForm.errors.login"));
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const reportData = new FormData();
      reportData.append("title", formData.issueTitle || "");
      reportData.append("report_type", String(formData.categoryId));
      if (formData.subcategoryId) {
        reportData.append("sub_category", String(formData.subcategoryId));
      }
      if (formData.description) {
        reportData.append("description", formData.description);
      }
      reportData.append("latitude", String(formData.latitude));
      reportData.append("longitude", String(formData.longitude));

      (formData.images || []).forEach((file) => {
        reportData.append("images", file);
      });

      await reportAPI.create(reportData);

      clearDraftStorage();

      setToast({
        message: t("reportForm.successSubmit"),
        type: "success",
      });

      setFormData(initialFormData);
      setStep(1);
      setDraftRestored(false);

      setTimeout(() => {
        navigate("/my-reports");
      }, 1500);
    } catch (error) {
      console.error("Error submitting report:", error);

      let errorMessage = t("reportForm.errors.submit");

      if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        errorMessage = t("reportForm.errors.session");
        setToast({
          message: errorMessage,
          type: "error",
        });
        setTimeout(() => navigate("/auth"), 2000);
      } else if (error.response?.data) {
        const backendErrors = error.response.data;
        if (typeof backendErrors === "object") {
          errorMessage = Object.entries(backendErrors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join(", ");
        } else if (typeof backendErrors === "string") {
          errorMessage = backendErrors;
        }
      }

      setToast({
        message: errorMessage,
        type: "error",
      });

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, isAuthenticated, user, navigate, t, clearDraftStorage]);

  useEffect(() => {
    let isValid = false;

    if (step === 1) {
      isValid =
        formData.issueTitle.trim() !== "" &&
        formData.reportType !== "" &&
        formData.subcategory !== "";

      if (formData.category?.includes("Other") || formData.category?.includes("specify")) {
        isValid = isValid && formData.otherCategory?.trim() !== "";
      }
    } else if (step === 2) {
      isValid = formData.latitude !== null && formData.longitude !== null;
    } else if (step === 3) {
      isValid = formData.images && formData.images.length > 0;
    }

    setIsNextDisabled(!isValid);
  }, [formData, step]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-3xl mx-auto bg-[#0e1030] text-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-10 shadow-lg">
        {draftRestored && (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm text-amber-100">
            <span>{t("reportForm.draftBanner")}</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraftRestored(false)}
                className="text-amber-200 underline hover:text-white"
              >
                {t("reportForm.dismissBanner")}
              </button>
              <button type="button" onClick={discardDraft} className="text-white/90 underline hover:text-white">
                {t("reportForm.discardDraft")}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const active = step === stepNumber;
            return (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 text-xs sm:text-base ${
                    active
                      ? "border-[#2f57ff] bg-[#2f57ff] text-white shadow-[0_0_10px_#2f57ff]"
                      : "border-gray-500 text-gray-400"
                  }`}
                >
                  {stepNumber}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center ${
                    active ? "text-white" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {step === 1 && <Step1Issue formData={formData} onInputChange={handleInputChange} />}
        {step === 2 && <Step2Location formData={formData} onInputChange={handleInputChange} />}
        {step === 3 && <Step3Evidence formData={formData} onInputChange={handleInputChange} />}

        {submitError && (
          <div className="mt-4 sm:mt-6 bg-red-500/10 border border-red-500 rounded-md p-2 sm:p-3 text-xs sm:text-sm text-red-400 whitespace-pre-line">
            {submitError}
          </div>
        )}

        <p className="mt-3 text-[10px] sm:text-xs text-gray-500">{t("reportForm.draftSaved")}</p>

        <div className="flex justify-between mt-6 sm:mt-8 lg:mt-10">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="text-xs sm:text-sm text-gray-300 hover:text-white flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("reportForm.prev")}
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isNextDisabled}
              className={`text-xs sm:text-sm flex items-center gap-1 ${
                isNextDisabled ? "text-gray-500 cursor-not-allowed" : "text-gray-300 hover:text-white"
              }`}
            >
              {t("reportForm.next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-md ${
                isNextDisabled || isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
              }`}
              disabled={isNextDisabled || isSubmitting}
            >
              {isSubmitting ? t("reportForm.submitting") : t("reportForm.submit")}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ReportForm;
