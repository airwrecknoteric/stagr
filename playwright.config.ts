import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;
const authState = process.env.E2E_AUTH_STATE;
const resolvedAuthState = authState ? resolve(authState) : undefined;

export const e2eEnvironmentReady = Boolean(
	baseURL && resolvedAuthState && existsSync(resolvedAuthState)
);

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 2 : 0,
	reporter: 'list',
	use: {
		baseURL: baseURL ?? 'http://127.0.0.1:4173',
		storageState: e2eEnvironmentReady ? resolvedAuthState : undefined,
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
