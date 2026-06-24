import { useCallback } from "react";
import {
  trackEvent,
  trackScreen,
  trackTrekView,
  trackSearch,
  trackTrekSaved,
  trackPlanWizardStep,
  trackPlanWizardCompleted,
  trackOperatorInquiry,
  trackProductPurchased,
  trackPremiumSubscribed,
  trackCheckin,
  trackUserSignedIn,
  trackUserSignedUp,
  trackTrekShared,
  trackNewsArticleViewed,
} from "@/lib/analytics";

export function useAnalytics() {
  return {
    trackEvent: useCallback(trackEvent, []),
    trackScreen: useCallback(trackScreen, []),
    trackTrekView: useCallback(trackTrekView, []),
    trackSearch: useCallback(trackSearch, []),
    trackTrekSaved: useCallback(trackTrekSaved, []),
    trackPlanWizardStep: useCallback(trackPlanWizardStep, []),
    trackPlanWizardCompleted: useCallback(trackPlanWizardCompleted, []),
    trackOperatorInquiry: useCallback(trackOperatorInquiry, []),
    trackProductPurchased: useCallback(trackProductPurchased, []),
    trackPremiumSubscribed: useCallback(trackPremiumSubscribed, []),
    trackCheckin: useCallback(trackCheckin, []),
    trackUserSignedIn: useCallback(trackUserSignedIn, []),
    trackUserSignedUp: useCallback(trackUserSignedUp, []),
    trackTrekShared: useCallback(trackTrekShared, []),
    trackNewsArticleViewed: useCallback(trackNewsArticleViewed, []),
  };
}
