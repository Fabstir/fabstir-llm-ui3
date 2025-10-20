// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { useEffect, useState } from "react";

interface ScreenReaderAnnouncementProps {
  message: string;
  politeness?: "polite" | "assertive";
}

export function ScreenReaderAnnouncement({
  message,
  politeness = "polite",
}: ScreenReaderAnnouncementProps) {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      const timer = setTimeout(() => setAnnouncement(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

export function useScreenReaderAnnouncement() {
  const [message, setMessage] = useState("");

  const announce = (msg: string, politeness: "polite" | "assertive" = "polite") => {
    setMessage("");
    setTimeout(() => setMessage(msg), 100);
  };

  return {
    announce,
    Announcer: () => <ScreenReaderAnnouncement message={message} />,
  };
}
