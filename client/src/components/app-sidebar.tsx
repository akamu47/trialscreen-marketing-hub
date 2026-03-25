import { LayoutDashboard, FileText, Megaphone, BarChart3, Shield, Settings, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Content Hub", url: "/content", icon: FileText },
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Compliance", url: "/compliance", icon: Shield },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

function TrialScreenLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="TrialScreen Logo" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="16" y1="24" x2="16" y2="28" stroke="currentColor" strokeWidth="2"/>
      <line x1="11" y1="28" x2="21" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="10" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M17 10l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25 10l-3 4 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="sidebar-nav">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 text-sidebar-foreground">
          <TrialScreenLogo />
          <div className="flex flex-col">
            <span className="font-display font-semibold text-sm leading-tight tracking-tight">TrialScreen</span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest font-medium">Marketing Hub</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4 mt-auto">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild data-testid={`nav-${item.title.toLowerCase()}`}>
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">SC</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-sidebar-foreground truncate">Sarah Chen</span>
                <span className="text-[10px] text-sidebar-foreground/50 truncate">Marketing Lead</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
