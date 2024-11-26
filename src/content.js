// This file extracts privacy policy information from the web page and communicates with the background script.

const extractPrivacyPolicy = () => {
    const privacyPolicyText = document.querySelector('body').innerText; // Simplified extraction logic
    return privacyPolicyText; // Return the extracted text
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPrivacyPolicy") {
        const privacyPolicy = extractPrivacyPolicy();
        sendResponse({ policy: privacyPolicy });
    }
});