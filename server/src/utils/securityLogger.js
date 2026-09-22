/**
 * Security Audit Logger for NSS Examination Portal
 * Logs suspicious activities, unauthorized access attempts, and security policy violations.
 * Output is kept on the server and never exposed to candidate responses.
 */

const logSecurityEvent = (eventType, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    securityEvent: eventType,
    ...details,
  };

  // Structured logging for monitoring / SIEM ingestion
  console.warn(`[SECURITY AUDIT] [${timestamp}] [${eventType}]`, JSON.stringify(logEntry));
};

module.exports = {
  logSecurityEvent,
};

