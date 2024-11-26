// This file contains the background script for the Chrome extension. 
// It handles events such as browser actions and manages the extension's lifecycle.

chrome.runtime.onInstalled.addListener(() => {
    console.log("Privacy Policy Summarizer extension installed.");
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "summarizePrivacyPolicy" });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "privacyPolicySummary") {
        console.log("Received privacy policy summary:", request.summary);
        // You can handle the summary here, e.g., save it or display it in the popup
    }
});