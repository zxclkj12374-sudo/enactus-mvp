import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OnboardingChat from "./pages/OnboardingChat";
import ActivityUpload from "./pages/ActivityUpload";
import InterviewPage from "./pages/InterviewPage";
import AdminDashboard from "./pages/AdminDashboard";
import PortfolioTimeline from "./pages/PortfolioTimeline";
import MyReport from "./pages/MyReport";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/onboarding"} component={OnboardingChat} />
      <Route path={"/profile"} component={OnboardingChat} />
      <Route path={"/activity"} component={ActivityUpload} />
      <Route path={"/interview"} component={InterviewPage} />
      <Route path={"/portfolio"} component={PortfolioTimeline} />
      <Route path={"/report"} component={MyReport} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
