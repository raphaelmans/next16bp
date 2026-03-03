export const OWNER_GET_STARTED_LAST_UPDATED_LABEL = "March 3, 2026";

export const OWNER_GET_STARTED_FAQS = [
  {
    id: "is-free",
    question: "Is KudosCourts really free?",
    answer:
      "The essentials are free: reservation inbox, Availability Studio, court management, guest profiles, team access with roles and permissions, multi-channel notifications, verified badge, and P2P payment coordination. No subscription fee for core setup.",
  },
  {
    id: "payments",
    question: "Do you handle payments?",
    answer:
      "Players pay your venue directly through your existing methods (GCash, Maya, bank transfer, or cash). KudosCourts handles reservation workflow.",
  },
  {
    id: "how-long",
    question: "How long does verification take?",
    answer:
      "After document submission, our team reviews your request and sends an update by email once approved or if additional details are needed.",
  },
  {
    id: "what-docs",
    question: "What documents should I prepare?",
    answer:
      "Upload proof of ownership or authorization to operate the venue. JPG, PNG, WebP, and PDF files are supported.",
  },
  {
    id: "already-listed",
    question: "My venue is already on KudosCourts. What should I do?",
    answer:
      "Use the claim flow in the setup hub, find your listing, and submit ownership verification so you can manage the venue.",
  },
  {
    id: "when-bookings",
    question: "When will players be able to book?",
    answer:
      "You decide when to enable online bookings. After verification, turn on reservations in venue settings when operations are ready.",
  },
  {
    id: "import-bookings",
    question: "Can I import my existing bookings?",
    answer:
      "Yes. You can import from ICS, CSV, XLSX, or screenshots to populate your schedule without starting from zero.",
  },
  {
    id: "team-access",
    question: "Can I invite my staff to help manage bookings?",
    answer:
      "Yes. Invite team members by email and assign one of three roles: Owner (full control), Manager (reservations, guest bookings, chat, notifications, and team management), or Viewer (read-only reservation access). Each role maps to six granular permissions so you control exactly who sees and does what.",
  },
  {
    id: "notifications",
    question: "How do notifications work?",
    answer:
      "Notifications are delivered through five channels: in-app inbox, web push, mobile push, email, and SMS. Each team member manages their own notification preferences and can opt in to reservation alerts per venue.",
  },
  {
    id: "business-plus",
    question: "What is Business Plus?",
    answer:
      "Business Plus is an upcoming premium tier with analytics, unlimited in-app chat, SEO and AI search visibility tools, and integrations.",
  },
  {
    id: "availability-studio",
    question: "What is the Availability Studio?",
    answer:
      "Availability Studio is a visual scheduling timeline where you set open slots, maintenance blocks, walk-in periods, and guest bookings.",
  },
] as const;
