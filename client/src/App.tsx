import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import Dashboard from "@/pages/dashboard";
import ContentHub from "@/pages/content-hub";
import Campaigns from "@/pages/campaigns";
import Analytics from "@/pages/analytics";
import Compliance from "@/pages/compliance";
import Contacts from "@/pages/contacts";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/content" component={ContentHub} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/compliance" component={Compliance} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-4 py-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
          <PerplexityAttribution />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router hook={useHashLocation}>
            <AppLayout />
          </Router>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
