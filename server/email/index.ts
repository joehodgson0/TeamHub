/**
 * Email Provider Factory
 *
 * Uses Resend through the attached Replit connector (preferred) or
 * RESEND_API_KEY. Falls back to console output for local development.
 */

import type { IEmailProvider } from "./types";
import { ConsoleEmailProvider } from "./console-provider";
import { ResendEmailProvider } from "./resend-provider";

let providerInstance: IEmailProvider | null = null;

export function getEmailProvider(): IEmailProvider {
  if (providerInstance) {
    return providerInstance;
  }

  if (process.env.REPL_ID || process.env.REPLIT_CONNECTORS_HOSTNAME || process.env.RESEND_API_KEY) {
    providerInstance = new ResendEmailProvider();
  } else {
    providerInstance = new ConsoleEmailProvider();
  }

  console.log(`Email provider initialized: ${providerInstance.name}`);
  return providerInstance;
}

export * from "./types";
