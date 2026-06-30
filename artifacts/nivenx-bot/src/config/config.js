/**
 * NivenX Assistant - Central Configuration v3.0
 * All customization lives here.
 */

export const config = {
  // Bot branding
  bot: {
    name: 'NivenX Assistant',
    version: '1.0.0',
    color: 0x5865F2,        // Primary embed color (Discord Blurple)
    successColor: 0x57F287, // Green
    errorColor: 0xED4245,   // Red
    warningColor: 0xFEE75C, // Yellow
    infoColor: 0x5865F2,    // Blurple
  },

  // Order settings
  orders: {
    prefix: 'NVX',          // Order ID prefix → NVX-0001
    startingNumber: 1,      // First order number
    autoCloseHours: 48,     // Hours before auto-closing unpaid orders
  },

  // Ticket settings
  tickets: {
    categoryName: 'TICKETS',         // Discord category for tickets
    transcriptChannelName: 'ticket-transcripts',
    autoCloseHours: 72,              // Hours before auto-closing inactive tickets
    maxOpenPerUser: 1,               // Max open tickets per user
  },

  // Logging
  logging: {
    channelName: 'bot-logs',        // Channel to post log events
    enabled: true,
  },

  // Review system
  reviews: {
    channelName: 'reviews',
    minRating: 1,
    maxRating: 5,
  },

  // Coupon settings
  coupons: {
    maxDiscountPercent: 100,
    codeLength: 8,
  },

  // Permission roles (set role names here — bot will find them by name)
  roles: {
    owner: 'Owner',
    admin: 'Admin',
    staff: 'Staff',
    // Customer = everyone else
  },

  // Available services
  services: [
    {
      id: 'hosting',
      label: '🖥️ Hosting',
      description: 'Web or application hosting solutions',
      fields: ['Domain/URL', 'Hosting Type', 'Expected Traffic', 'Budget'],
    },
    {
      id: 'vps',
      label: '☁️ VPS',
      description: 'Virtual Private Server',
      fields: ['OS Preference', 'RAM/CPU Requirements', 'Storage Needed', 'Budget'],
    },
    {
      id: 'domains',
      label: '🌐 Domains',
      description: 'Domain registration and management',
      fields: ['Desired Domain', 'TLD Preference (.com, .net, etc.)', 'Duration', 'Budget'],
    },
    {
      id: 'discord_setup',
      label: '💬 Discord Server Setup',
      description: 'Complete Discord server configuration',
      fields: ['Server Purpose', 'Estimated Member Count', 'Features Needed', 'Budget'],
    },
    {
      id: 'discord_bot',
      label: '🤖 Discord Bot Development',
      description: 'Custom Discord bot creation',
      fields: ['Bot Purpose', 'Key Features', 'Technology Preference', 'Budget'],
    },
    {
      id: 'web_dev',
      label: '🌍 Website Development',
      description: 'Professional website design and development',
      fields: ['Website Type', 'Key Pages/Features', 'Design Preferences', 'Budget'],
    },
    {
      id: 'custom',
      label: '✨ Custom Request',
      description: 'Something not listed above',
      fields: ['Project Description', 'Requirements', 'Timeline', 'Budget'],
    },
  ],

  // Order statuses
  orderStatuses: {
    PENDING: 'Pending',
    AWAITING_PAYMENT: 'Awaiting Payment',
    PAID: 'Paid',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },

  // Status colors for embeds
  statusColors: {
    Pending: 0xFEE75C,
    'Awaiting Payment': 0xEB459E,
    Paid: 0x57F287,
    'In Progress': 0x5865F2,
    Completed: 0x57F287,
    Cancelled: 0xED4245,
  },
};
