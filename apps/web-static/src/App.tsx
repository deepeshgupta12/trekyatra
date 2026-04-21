import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Explore from "./pages/Explore.tsx";
import TrekDetail from "./pages/TrekDetail.tsx";
import Compare from "./pages/Compare.tsx";
import Region from "./pages/Region.tsx";
import Seasonal from "./pages/Seasonal.tsx";
import { Packing, Permits, Costs, Itinerary, Beginner, Gear, Safety, Plan, Newsletter, Products, About, Generic } from "./pages/content/ContentPages.tsx";
import { SignIn, SignUp, OTP } from "./pages/auth/AuthPages.tsx";
import { ForgotPassword, ResetPassword, VerifyEmail, InvalidToken, Onboarding } from "./pages/auth/AuthStates.tsx";
import { Dashboard } from "./pages/account/Dashboard.tsx";
import { SavedTreks, CompareWorkspace, Downloads, Enquiries, AccountSettings } from "./pages/account/AccountScreens.tsx";
import { AdminDashboard } from "./pages/admin/AdminPages.tsx";
import { TopicDiscovery, KeywordClusters, BriefReview, DraftReview, FactCheck, InternalLinking, Monetization, Analytics, AgentLogs, AdminSettings } from "./pages/admin/AdminScreens.tsx";
import { SearchResults, NoResults, EmptySaved, UnderReview, Maintenance } from "./pages/SystemStates.tsx";
import { NewsletterSuccess, PlanSuccess, CheckoutSuccess, ResetPasswordSuccess, SignupSuccess } from "./pages/SuccessStates.tsx";
import { ProductDetail, Checkout } from "./pages/ProductDetail.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/trek/:slug" element={<TrekDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/regions/:slug" element={<Region />} />
          <Route path="/seasons/:slug" element={<Seasonal />} />
          <Route path="/packing" element={<Packing />} />
          <Route path="/permits" element={<Permits />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/itineraries" element={<Itinerary />} />
          <Route path="/beginner" element={<Beginner />} />
          <Route path="/gear" element={<Gear />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/about/authors" element={<Generic eyebrow="Authors" title="Meet our editors" subtitle="Field-tested, India-based, opinionated." />} />
          <Route path="/methodology" element={<Generic eyebrow="Methodology" title="How we research, write & verify" subtitle="Our editorial process, freshness logic, and safety-first principles." />} />
          <Route path="/contact" element={<Generic eyebrow="Contact" title="Get in touch" subtitle="Press, partnerships, content tips, or planning help." />} />
          <Route path="/privacy" element={<Generic eyebrow="Privacy" title="Privacy Policy" subtitle="What we collect, why, and how we protect it." />} />
          <Route path="/terms" element={<Generic eyebrow="Terms" title="Terms & Conditions" subtitle="The rules of using TrekYatra." />} />
          <Route path="/affiliate-disclosure" element={<Generic eyebrow="Disclosure" title="Affiliate Disclosure" subtitle="How we make money — transparently." />} />
          <Route path="/safety-disclaimer" element={<Generic eyebrow="Safety" title="Safety Disclaimer" subtitle="Read this before you plan a trek using our content." />} />
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/sign-up" element={<SignUp />} />
          <Route path="/auth/otp" element={<OTP />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/invalid-token" element={<InvalidToken />} />
          <Route path="/auth/onboarding" element={<Onboarding />} />
          <Route path="/account" element={<Dashboard />} />
          <Route path="/account/saved" element={<SavedTreks />} />
          <Route path="/account/compare" element={<CompareWorkspace />} />
          <Route path="/account/downloads" element={<Downloads />} />
          <Route path="/account/enquiries" element={<Enquiries />} />
          <Route path="/account/settings" element={<AccountSettings />} />
          <Route path="/saved" element={<SavedTreks />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/no-results" element={<NoResults />} />
          <Route path="/empty-saved" element={<EmptySaved />} />
          <Route path="/under-review" element={<UnderReview />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success/newsletter" element={<NewsletterSuccess />} />
          <Route path="/success/plan" element={<PlanSuccess />} />
          <Route path="/success/checkout" element={<CheckoutSuccess />} />
          <Route path="/success/password-reset" element={<ResetPasswordSuccess />} />
          <Route path="/success/signup" element={<SignupSuccess />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/topics" element={<TopicDiscovery />} />
          <Route path="/admin/clusters" element={<KeywordClusters />} />
          <Route path="/admin/briefs" element={<BriefReview />} />
          <Route path="/admin/drafts" element={<DraftReview />} />
          <Route path="/admin/fact-check" element={<FactCheck />} />
          <Route path="/admin/linking" element={<InternalLinking />} />
          <Route path="/admin/monetization" element={<Monetization />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/logs" element={<AgentLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
