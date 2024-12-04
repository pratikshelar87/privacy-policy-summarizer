# Privacy Policy Summarizer

## Overview
The Privacy Policy Summarizer is a Chrome extension designed to extract and summarize privacy policy information from websites. It provides users with a concise overview of privacy practices, helping them make informed decisions about their online privacy.

## Features
- Automatically detects and summarizes privacy policies from web pages.
- User-friendly popup interface to display summarized information.
- Lightweight and efficient background script for seamless operation.
- Utilizes AI services like Chrome Prompt API for analysis.

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/privacy-policy-summarizer.git
   ```
2. Navigate to the project directory:
   ```
   cd privacy-policy-summarizer
   ```
3. Open Chrome and go to `chrome://extensions/`.
4. Enable "Developer mode" in the top right corner.
5. Click on "Load unpacked" and select the `privacy-policy-summarizer` directory.

## Usage
- Click on the extension icon in the Chrome toolbar to open the popup.
- The extension will automatically extract and summarize the privacy policy of the current webpage.

## Configuration
- Ensure that the `manifest.json` file includes the necessary permissions and icons.
- Update the AI provider API keys in the `src/popup/aiProvider.js` file.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.