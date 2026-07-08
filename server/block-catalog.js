// Single source of truth for the "Add a block" catalog — mirrors Linktree's
// categorized picker (screenshots Ben provided) grouped by what it actually
// costs to build/host, per the original LINKLEAF-COMPLETE.md spec's own
// tiering. `implemented: true` types are live (Tier 0/0.5 — no DB beyond the
// blocks row, no payments). `implemented: false` are Tier 1/2 — need their
// own tables and/or real payment processing, shown in the picker as
// "Coming soon" so the UI reads complete even before they're built.
// Icon names are lucide-react component names, resolved client-side.

const CATEGORIES = [
  {
    key: 'basics',
    label: 'Basics',
    blocks: [
      { type: 'link', label: 'Link', icon: 'Link2', implemented: true },
      { type: 'text', label: 'Text', icon: 'Type', implemented: true },
      { type: 'header', label: 'Header', icon: 'Heading', implemented: true },
      { type: 'video', label: 'Video Embed', icon: 'Video', implemented: true }
    ]
  },
  {
    key: 'social',
    label: 'Social & Media',
    blocks: [
      { type: 'youtube', label: 'YouTube', icon: 'Youtube', implemented: true },
      { type: 'instagram', label: 'Instagram', icon: 'Instagram', implemented: true },
      { type: 'tiktok', label: 'TikTok', icon: 'Music2', implemented: true },
      { type: 'spotify', label: 'Spotify', icon: 'Music2', implemented: true },
      { type: 'soundcloud', label: 'SoundCloud', icon: 'AudioLines', implemented: true },
      { type: 'vimeo', label: 'Vimeo', icon: 'Video', implemented: true },
      { type: 'discord', label: 'Discord', icon: 'MessageSquare', implemented: true },
      { type: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', implemented: true }
    ]
  },
  {
    key: 'info',
    label: 'Info & Contact',
    blocks: [
      { type: 'maps', label: 'Maps', icon: 'MapPin', implemented: true },
      { type: 'faq', label: 'FAQs', icon: 'HelpCircle', implemented: true },
      { type: 'contact', label: 'Contact Details', icon: 'Contact', implemented: true },
      { type: 'calendly', label: 'Calendly', icon: 'Calendar', implemented: true },
      { type: 'typeform', label: 'Typeform', icon: 'FileText', implemented: true }
    ]
  },
  {
    key: 'promo',
    label: 'Promotions & Events',
    blocks: [
      { type: 'gofundme', label: 'GoFundMe', icon: 'HeartHandshake', implemented: true },
      { type: 'discount', label: 'Discount Code', icon: 'Tag', implemented: true },
      { type: 'tour_events', label: 'Tour & Events', icon: 'Ticket', implemented: true }
    ]
  },
  {
    key: 'signup',
    label: 'Signup & Engagement',
    blocks: [
      { type: 'email', label: 'Email Signup', icon: 'Mail', implemented: true },
      { type: 'form', label: 'Contact Form', icon: 'ClipboardList', implemented: false },
      { type: 'sms_signup', label: 'SMS Signup', icon: 'MessageSquareText', implemented: false },
      { type: 'poll', label: 'Poll', icon: 'BarChart2', implemented: false },
      { type: 'presave', label: 'Music Presave', icon: 'Disc3', implemented: false }
    ]
  },
  {
    key: 'products',
    label: 'Products & Bookings',
    blocks: [
      { type: 'digital_product', label: 'Digital Products', icon: 'Download', implemented: false },
      { type: 'course', label: 'Courses', icon: 'GraduationCap', implemented: false },
      { type: 'coaching', label: 'Coaching & Bookings', icon: 'CalendarClock', implemented: false },
      { type: 'affiliate', label: 'Affiliate Products', icon: 'Tags', implemented: false },
      { type: 'shopify', label: 'Shopify', icon: 'ShoppingBag', implemented: false }
    ]
  }
];

const IMPLEMENTED_TYPES = CATEGORIES.flatMap((c) => c.blocks.filter((b) => b.implemented).map((b) => b.type));

module.exports = { CATEGORIES, IMPLEMENTED_TYPES };
