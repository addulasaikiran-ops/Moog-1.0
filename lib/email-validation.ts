const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidReportEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
