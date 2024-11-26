Get inspired
Blog
Docs
New in Chrome
Search
/


English
Sign in
AI on Chrome
AI
Built-in
WebGPU
Extensions and AI
DevTools and AI

Home
Docs
AI on Chrome
Built-in
Was this helpful?

The Prompt API in Chrome Extensions 

bookmark_border

Thomas Steiner
Thomas Steiner
     

Published: November 11, 2024

The Prompt API for Extensions is now available in an origin trial, so you can build Chrome Extensions that use Gemini Nano, our most efficient language model, in the browser.

There are many use cases for the Prompt API with Chrome Extensions. Here are some examples:

Instant calendar events. Develop a Chrome Extension that automatically extracts event details from web pages, so users can create calendar entries in just a few steps.
Seamless contact extraction. Build an extension that extracts contact information from websites, making it easier for users to contact a business or add details to their list of contacts.
Dynamic content filtering. Create a Chrome Extension that analyzes news articles and automatically blurs or hides content based on user-defined topics.
These are just a few possibilities, but we're excited to see what you create.

Availability
Join the Prompt API origin trial, running in Chrome 131 to 136, to create Extensions with this API. If you're new to origin trials, these are time-limited programs open to all developers, offering early access to experimental platform features. Developers can test, gather user feedback, and iterate towards a future launch.
While there may be usage limits, you can integrate these features for live testing and gathering user feedback. The goal is to inform future iterations of this API, as we work towards wider availability.
Join the early preview program for an early look at new built-in AI APIs and access to discussion on our mailing list.
Participate in the origin trial
To use the Prompt API in Chrome Extensions, add the "aiLanguageModelOriginTrial" permission to your manifest.json file as per the following excerpt, along with any other permissions your extension may need.

To sign up your extension for the origin trial, use the URL chrome-extension://YOUR_EXTENSION_ID as the Web Origin. For example, chrome-extension://ljjhjaakmncibonnjpaoglbhcjeolhkk.

Note: For more details, check the Extensions origin trial documentation.
Chrome Origin Trial sign up

The extension ID is dynamically created. Once assigned, you can force the ID to remain stable by adding the key property to the manifest.

After you've signed up for the original trial, you receive a generated token, which you need to pass in an array as the value of the trial_tokens field in the manifest.


{
  "manifest_version": 3,
  "name": "YOUR_EXTENSION_NAME",
  "permissions": ["aiLanguageModelOriginTrial"],
  "trial_tokens": ["GENERATED_TOKEN"],
}
Note: We don't recommend using optional_permissions, as granting aiLanguageModelOriginTrial at runtime doesn't take immediate effect.
Note: This grants temporary permission, valid only for the duration of the origin trial. If the API launches, you need to update and re-upload your extension, removing the expired permission and replacing it with the final permissions.
Add support to localhost
To access the Prompt API on localhost during the origin trial, you must update Chrome to the latest version. Then, follow these steps:

Open Chrome on one of these platforms: Windows, Mac, or Linux.
Go to chrome://flags/#optimization-guide-on-device-model.
Select Enabled BypassPerfRequirement.
This skips performance checks which may prevent you from downloading Gemini Nano onto your device.
Click Relaunch or restart Chrome.
Use the Prompt API
Once you have requested permission to use the Prompt API, you can build your extension. There are two new extension functions available to you in the chrome.aiOriginTrial.languageModel namespace:

capabilities() to check what the model is capable of and if it's available.
create() to start a language model session.
Model download
The Prompt API uses the Gemini Nano model in Chrome. While the API is built into Chrome, the model is downloaded separately the first time an extension uses the API.

To determine if the model is ready to use, call the asynchronous chrome.aiOriginTrial.languageModel.capabilities() function. It returns an AILanguageModelCapabilities object with an available field that can take three possible values:

'no': The current browser supports the Prompt API, but it can't be used at the moment. This could be for a number of reasons, such as insufficient available disk space available to download the model.
'readily': The current browser supports the Prompt API, and it can be used right away.
'after-download': The current browser supports the Prompt API, but it needs to download the model first.
To trigger the model download and create the language model session, call the asynchronous chrome.aiOriginTrial.languageModel.create() function. If the response to capabilities() was 'after-download', it's best practice to listen for download progress. This way, you can inform the user in case the download takes time.

const session = await chrome.aiOriginTrial.languageModel.create({
  monitor(m) {
    m.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
    });
  },
});
Model capabilities
The capabilities() function also informs you of the language model's capabilities. Apart from available, the resulting AILanguageModelCapabilities object also has the following fields:

defaultTopK: The default top-K value (default: 3).
maxTopK: The maximum top-K value (8).
defaultTemperature: The default temperature (1.0). The temperature must be between 0.0 and 2.0.
await chrome.aiOriginTrial.languageModel.capabilities();
// {available: 'readily', defaultTopK: 3, maxTopK: 8, defaultTemperature: 1}
Note: A maxTemperature field to get the maximum temperature is specified, but not yet implemented.
Create a session
Once you have made sure the Prompt API can run, you create a session with the create() function, which then lets you prompt the model with either the prompt() or the promptStreaming() functions.

Session options
Each session can be customized with topK and temperature using an optional options object. The default values for these parameters are returned from chrome.aiOriginTrial.languageModel.capabilities().

const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
// Initializing a new session must either specify both `topK` and
// `temperature` or neither of them.
const slightlyHighTemperatureSession = await chrome.aiOriginTrial.languageModel.create({
  temperature: Math.max(capabilities.defaultTemperature * 1.2, 2.0),
  topK: capabilities.defaultTopK,
});
The create() function's optional options object also takes a signal field, which lets you pass an AbortSignal to destroy the session.

const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const session = await chrome.aiOriginTrial.languageModel.create({
  signal: controller.signal,
})
System prompts
With system prompts, you can give the language model some context.


const session = await chrome.aiOriginTrial.languageModel.create({
  systemPrompt: 'You are a helpful and friendly assistant.',
});
await session.prompt('What is the capital of Italy?');
// 'The capital of Italy is Rome.'
Initial prompts
With initial prompts, you can provide the language model with context about previous interactions, for example, to allow the user to resume a stored session after a browser restart.


const session = await chrome.aiOriginTrial.languageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a helpful and friendly assistant.' },
    { role: 'user', content: 'What is the capital of Italy?' },
    { role: 'assistant', content: 'The capital of Italy is Rome.'},
    { role: 'user', content: 'What language is spoken there?' },
    { role: 'assistant', content: 'The official language of Italy is Italian. [...]' }
  ]
});
Session information
A given language model session has a maximum number of tokens it can process. You can check usage and progress toward that limit by using the following properties on the session object:


console.log(`${session.tokensSoFar}/${session.maxTokens}
(${session.tokensLeft} left)`);
Note: There is a per prompt limit of 1,024 tokens, and the session can retain the last 4,096 tokens.
Session persistence
Each session keeps track of the context of the conversation. Previous interactions are taken into account for future interactions until the session's context window is full.


const session = await chrome.aiOriginTrial.languageModel.create({
  systemPrompt: 'You are a friendly, helpful assistant specialized in clothing choices.'
});

const result1 = await session.prompt(
  'What should I wear today? It is sunny. I am unsure between a t-shirt and a polo.'
);
console.log(result1);

const result2 = await session.prompt(
  'That sounds great, but oh no, it is actually going to rain! New advice?'
);
console.log(result2);
Clone a session
To preserve resources, you can clone an existing session with the clone() function. The conversation context is reset, but the initial prompt or the system prompts will remain intact. The clone() function takes an optional options object with a signal field, which lets you pass an AbortSignal to destroy the cloned session.


const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const clonedSession = await session.clone({
  signal: controller.signal,
});
Prompt the model
You can prompt the model with either the prompt() or the promptStreaming() functions.

Non-streaming output
If you expect a short result, you can use the prompt() function that returns the response once it's available.


// Start by checking if it's possible to create a session based on the
// availability of the model, and the characteristics of the device.
const {available, defaultTemperature, defaultTopK, maxTopK } =
  await chrome.aiOriginTrial.languageModel.capabilities();

if (available !== 'no') {
  const session = await chrome.aiOriginTrial.languageModel.create();

  // Prompt the model and wait for the whole result to come back.
  const result = await session.prompt('Write me a poem!');
  console.log(result);
}
Streaming output
If you expect a longer response, you should use the promptStreaming() function which lets you show partial results as they come in from the model.


const {available, defaultTemperature, defaultTopK, maxTopK } =
  await chrome.aiOriginTrial.languageModel.capabilities();

if (available !== 'no') {
  const session = await chrome.aiOriginTrial.languageModel.create();

  // Prompt the model and stream the result:
  const stream = session.promptStreaming('Write me an extra-long poem!');
  for await (const chunk of stream) {
    console.log(chunk);
  }
}
promptStreaming() returns a ReadableStream whose chunks successively build on each other. For example, "Hello,", "Hello world,", "Hello world I am,", "Hello world I am an AI.". This isn't the intended behavior. We intend to align with other streaming APIs on the platform, where the chunks are successive pieces of a single long stream. This means the output would be a sequence like "Hello", " world", " I am", " an AI".

For now, to achieve the intended behavior, you can implement the following. This works with both the standard and the non-standard behavior.


let result = '';
let previousChunk = '';

for await (const chunk of stream) {
  const newChunk = chunk.startsWith(previousChunk)
      ? chunk.slice(previousChunk.length) : chunk;
  console.log(newChunk);
  result += newChunk;
  previousChunk = chunk;
}
console.log(result);
Stop running a prompt
Both prompt() and promptStreaming() accept an optional second parameter with a signal field, which lets you stop running prompts.


const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const result = await session.prompt(
  'Write me a poem!',
  { signal: controller.signal }
);
Terminate a session
Call destroy() to free resources if you no longer need a session. When a session is destroyed, it can no longer be used, and any ongoing execution is aborted. You may want to keep the session around if you intend to prompt the model often since creating a session can take some time.


await session.prompt(
  'You are a friendly, helpful assistant specialized in clothing choices.'
);

session.destroy();

// The promise is rejected with an error explaining that
// the session is destroyed.
await session.prompt(
  'What should I wear today? It is sunny and I am unsure
  between a t-shirt and a polo.'
);
Demo
To test the Prompt API in Chrome Extensions, install the demo extension. The extension source code is available on GitHub.

Demo interface for the Prompt API

Participate and share feedback
Start testing the Prompt API now in your Chrome Extensions by joining the origin trial and share your feedback. Your input can directly impact how we build and implement future versions of this API, and all built-in AI APIs.

For feedback on Chrome's implementation, file a bug report or a feature request.
Share your feedback on the API shape of the Prompt API by commenting on an existing Issue or by opening a new one in the Prompt API GitHub repository.
Check out the Prompt API sample extension on GitHub.
Participate in the standards effort by joining the Web Incubator Community Group.
Was this helpful?

Except as otherwise noted, the content of this page is licensed under the Creative Commons Attribution 4.0 License, and code samples are licensed under the Apache 2.0 License. For details, see the Google Developers Site Policies. Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2024-11-11 UTC.

Contribute
File a bug
See open issues
Related content
Chromium updates
Case studies
Archive
Podcasts & shows
Follow
@ChromiumDev on X
YouTube
Chrome for Developers on LinkedIn
RSS
Terms
Privacy

English