import { AIProviderService } from './aiProvider.js'; 

class PrivacyAnalyzer {
    constructor() {
        this.aiService = new AIProviderService();
        this.loadingDiv = document.getElementById('loading');
        this.resultContainer = document.getElementById('result-container');
        this.summaryDiv = document.getElementById('summary');
        console.log('Elements:', {
            loadingDiv: this.loadingDiv,
            resultContainer: this.resultContainer,
            summaryDiv: this.summaryDiv
        });
        this.initialize();
    }

    async initialize() {
        console.log('Initialization started');
        this.loadingDiv.style.display = 'block';
        this.resultContainer.style.display = 'none';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab.url;
            console.log('Active tab URL:', url);

            // Check local storage for existing analysis
            const storedAnalysis = localStorage.getItem(url);
            if (storedAnalysis) {
                console.log('Using stored analysis:', storedAnalysis);
                this.displayResults(JSON.parse(storedAnalysis));
            } else {
                console.log('No stored analysis found, performing AI analysis');
                const [{ result }] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => document.body.innerText
                });
                console.log('Page content:', result);

                const analysis = await this.aiService.analyzePage(result);
                console.log('Analysis result:', analysis);

                // Save the analysis result in local storage
                localStorage.setItem(url, analysis);
                this.displayResults(JSON.parse(analysis));
            }
        } catch (error) {
            this.showError('Unable to analyze this privacy policy. Please try again.');
            console.error('Analysis failed:', error);
        } finally {
            this.loadingDiv.style.display = 'none';
        }
    }

    displayResults(analysis) {
        console.log('Displaying results:', analysis);
        this.resultContainer.style.display = 'block';

        // Set traffic light
        const lights = document.querySelectorAll('.light');
        lights.forEach(light => light.classList.remove('active'));

        switch (analysis.overallRisk) {
            case 'HIGH':
                document.querySelector('.light.red').classList.add('active');
                document.querySelector('.score-text').textContent = 'High Privacy Risk';
                break;
            case 'MEDIUM':
                document.querySelector('.light.yellow').classList.add('active');
                document.querySelector('.score-text').textContent = 'Medium Privacy Risk';
                break;
            case 'LOW':
                document.querySelector('.light.green').classList.add('active');
                document.querySelector('.score-text').textContent = 'Low Privacy Risk';
                break;
        }

        // Display categories in a 2x2 grid with accordion
        this.summaryDiv.innerHTML = `
            <div class="category">
                <div class="category-header">Overall Assessment</div>
                <div class="category-content">${analysis.summary}</div>
            </div>
            <div class="grid-container">
                ${analysis.categories.map(category => `
                    <div class="category">
                        <div class="category-header">
                            <div class="indicator ${category.risk.toLowerCase()}"></div>
                            ${this.formatCategoryName(category.name)}
                        </div>
                        <div class="category-content">${category.details}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners to toggle the active class on click
        const headers = this.summaryDiv.querySelectorAll('.category-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.style.display = content.style.display === 'block' ? 'none' : 'block';
            });
        });
    }

    formatCategoryName(name) {
        return name.split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    }

    showError(message) {
        console.log('Error:', message);
        this.resultContainer.style.display = 'block';
        this.summaryDiv.innerHTML = `<div class="category error">${message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    new PrivacyAnalyzer();
});