/**
 * DeclarativeNetRequest helper for repeat-visit protection against confirmed malicious destinations.
 *
 * Technical Limitation:
 * Chrome Manifest V3 cannot pause the initial navigation request to await an async remote API scan.
 * However, once a URL is classified as MALICIOUS, dynamic DNR rules provide instant redirection
 * on subsequent or repeated visits to the flagged destination.
 */

const MAX_DNR_RULES = 40;
const BASE_RULE_ID = 1000;

export async function addMaliciousDnrRule(domain: string, scanId: string, url: string): Promise<void> {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) return;

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();

    // Check if domain already has a rule
    const cleanedDomain = domain.toLowerCase().trim();
    const alreadyBlocked = existingRules.some(
      (r) => r.condition.urlFilter?.includes(cleanedDomain)
    );
    if (alreadyBlocked) return;

    // Keep rules count bounded (evict oldest if full)
    const removeRuleIds: number[] = [];
    if (existingRules.length >= MAX_DNR_RULES) {
      removeRuleIds.push(existingRules[0].id);
    }

    const nextId = existingRules.length > 0
      ? Math.max(...existingRules.map((r) => r.id)) + 1
      : BASE_RULE_ID;

    const warningRedirectUrl = chrome.runtime.getURL(
      `src/pages/warning.html?scan=${encodeURIComponent(scanId)}&url=${encodeURIComponent(url)}&risk=malicious`
    );

    const newRule: chrome.declarativeNetRequest.Rule = {
      id: nextId,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          url: warningRedirectUrl,
        },
      },
      condition: {
        urlFilter: `||${cleanedDomain}^`,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      },
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: [newRule],
    });
  } catch (err) {
    console.warn("Unable to register DNR dynamic rule for malicious destination:", err);
  }
}

export async function clearMaliciousDnrRules(): Promise<void> {
  if (!chrome.declarativeNetRequest?.getDynamicRules) return;
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map((r) => r.id);
    if (removeRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
    }
  } catch {
    // Ignore cleanup errors
  }
}

