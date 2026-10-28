"use client";

import dynamic from "next/dynamic";
import { Header, type NavItem } from "./header";
import { Footer, type FooterProps } from "./footer";
import { SmoothScrollProvider } from "../providers/smooth-scroll";

// Lazy-load the chat widget so it does not block critical bundle or LCP
const AIChatWidget = dynamic(
  () => import("../chat/ai-chat-widget").then((m) => m.AIChatWidget),
  { ssr: false }
);

export interface PublicShellProps {
  children: React.ReactNode;
  navLinks?: NavItem[];
  footerConfig?: FooterProps;
}

export function PublicShell({ children, navLinks, footerConfig }: PublicShellProps) {
  const triggerOpenChat = () => {
    window.dispatchEvent(
      new CustomEvent("open-ai-chat", {
        detail: {
          slug: "",
          title: "AI Latest News Global Assistant",
        },
      })
    );
  };

  return (
    <SmoothScrollProvider>
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <Header onOpenChat={triggerOpenChat} navLinks={navLinks} />
        <main className="flex-1">{children}</main>
        <Footer {...footerConfig} />
        <AIChatWidget />
      </div>
    </SmoothScrollProvider>
  );
}
