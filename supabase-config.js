export const supabaseConfig = {
  url: "https://smsdzxseidxywmdeinkt.supabase.co",
  publishableKey: "sb_publishable_IGylSYHYtcaneh59hbYsFA_S26cxu0z",
};

export const supabaseConfigured = Object.values(supabaseConfig).every((value) => {
  const normalized = String(value).trim();
  return normalized.length > 0 && !normalized.includes("YOUR_");
});
