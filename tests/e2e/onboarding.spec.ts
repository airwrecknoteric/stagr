import { expect, test } from '@playwright/test';
import { e2eEnvironmentReady } from '../../playwright.config';

test.describe('Onboarding-Wizard', () => {
	test.skip(
		!e2eEnvironmentReady,
		'E2E benötigt E2E_BASE_URL und E2E_AUTH_STATE mit einem frischen, angemeldeten Testkonto.'
	);

	test('DJ-Flow: Redirect, Resume, Zurück und Doppelsubmit', async ({ page }) => {
		await page.goto('/app');
		await expect(page).toHaveURL(/\/app\/onboarding\/role$/);
		await expect(
			page.getByRole('heading', { name: 'Wie möchtest du Stagr nutzen?' })
		).toBeVisible();

		await page.getByRole('button', { name: /^DJ\b/ }).click();
		await page.getByRole('button', { name: 'Weiter' }).click();
		await expect(page).toHaveURL(/\/app\/onboarding\/profile$/);

		await page.getByLabel('Künstlername').fill('Playwright DJ');
		await page.getByLabel('Kurzprofil').fill('Ein E2E-Testprofil für den Onboarding-Wizard.');
		await page.getByRole('button', { name: 'Weiter' }).click();
		await expect(page).toHaveURL(/\/app\/onboarding\/details$/);

		await page.reload();
		await expect(page).toHaveURL(/\/app\/onboarding\/details$/);
		await expect(page.getByRole('heading', { name: 'Die wichtigen Details' })).toBeVisible();

		await page.getByRole('button', { name: 'House', exact: true }).click();
		await page.getByLabel('Stadt').fill('Berlin');
		await page.getByLabel('Land').fill('Deutschland');
		await page.getByRole('button', { name: 'Weiter' }).click();
		await expect(page).toHaveURL(/\/app\/onboarding\/review$/);
		await expect(page.getByRole('heading', { name: 'Playwright DJ' })).toBeVisible();

		await page.reload();
		await expect(page).toHaveURL(/\/app\/onboarding\/review$/);
		await expect(page.getByText('Berlin, Deutschland')).toBeVisible();
		await expect(
			page.getByText('Dein Profil wird angelegt, aber noch nicht veröffentlicht.')
		).toBeVisible();

		await page.getByRole('button', { name: 'Zurück' }).click();
		await expect(page).toHaveURL(/\/app\/onboarding\/details$/);
		await expect(page.getByLabel('Stadt')).toHaveValue('Berlin');
		await expect(page.getByRole('button', { name: 'House', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await page.getByRole('button', { name: 'Weiter' }).click();
		await expect(page).toHaveURL(/\/app\/onboarding\/review$/);

		await page.locator('form').evaluate((form) => {
			if (!(form instanceof HTMLFormElement)) {
				throw new Error('Onboarding-Formular nicht gefunden');
			}
			form.requestSubmit();
			form.requestSubmit();
		});

		await expect(page).toHaveURL(/\/app\/onboarding\/success$/);
		await expect(page.getByRole('heading', { name: 'Dein Profil ist startklar' })).toBeVisible();
		await expect(
			page.getByText('Du kannst jetzt deine App öffnen und dein unveröffentlichtes Profil')
		).toBeVisible();
	});
});
