"use client";

import dynamic from "next/dynamic";
import { Header, type NavItem, type TickerHeadline } from "./header";
import { Footer, type FooterProps } from "./footer";
import { SmoothScrollProvider } from "../providers/smooth-scroll";
import { ReadingQueueDrawer } from "../interactive/reading-queue-drawer";

// Lazy-load the chat widget so it does not block critical bundle or LCP
const AIChatWidget = dynamic(
  () => import("../chat/ai-chat-widget").then((m) => m.AIChatWidget),
  { ssr: false }
);

export interface PublicShellProps {
  children: React.ReactNode;
  navLinks?: NavItem[];
  footerConfig?: FooterProps;
  headlines?: TickerHeadline[];
}

export function PublicShell({
  children,
  navLinks,
  footerConfig,
  headlines,
}: PublicShellProps) {
  const triggerOpenChat = () => {
    window.dispatchEvent(
      new CustomEvent("open-ai-chat", {
        detail: {
          slug: "",
          title: "Kraviona AI News Intelligence Assistant",
        },
      })
    );
  };

  return (
    <SmoothScrollProvider>
      <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        <Header
          onOpenChat={triggerOpenChat}
          navLinks={navLinks}
          headlines={headlines}
        />
        <main className="flex-1">{children}</main>
        <Footer {...footerConfig} />
        <AIChatWidget />
        <ReadingQueueDrawer />
      </div>
    </SmoothScrollProvider>
  );
}
