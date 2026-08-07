/**
 * Email Provider Factory
 *
 * Uses the Resend provider when RESEND_API_KEY is set, otherwise
 * falls back to logging emails to the console (safe default for
 * development and for clubs that haven't configured email yet).
 */

import type { IEmailProvider } from "./types";
import { ConsoleEmailProvider } from "./console-provider";
import { ResendEmailProvider } from "./resend-provider";

let providerInstance: IEmailProvider | null = null;

export function getEmailProvider(): IEmailProvider {
  if (providerInstance) {
    return providerInstance;
  }

  if (process.env.RESEND_API_KEY) {
    providerInstance = new ResendEmailProvider();
  } else {
    providerInstance = new ConsoleEmailProvider();
  }

  console.log(`Email provider initialized: ${providerInstance.name}`);
  return providerInstance;
}

export * from "./types";
