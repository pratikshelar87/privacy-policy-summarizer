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

            // Check if the URL contains "privacy" or "legal" or "policy"
            if (url.includes('privacy') || url.includes('legal') || url.includes('policy')) {
                // Check local storage for existing analysis
                const storedAnalysis = localStorage.getItem(url);
                if (storedAnalysis) {
                    console.log('Using stored analysis:', storedAnalysis);
                    this.displayResults(JSON.parse(storedAnalysis));
                    this.changeIcon(true);
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
                    this.changeIcon(true);
                }
            } else {
                console.log('URL does not contain "privacy", "legal", or "policy", skipping analysis');
                this.changeIcon(false);
            }
        } catch (error) {
            this.showError('Unable to analyze this privacy policy. Please try again.');
            console.error('Analysis failed:', error);
            this.changeIcon(false);
        } finally {
            this.loadingDiv.style.display = 'none';
        }
    }

    changeIcon(detected) {
        const iconPath = detected ? 'src/icons/privacy_detected_filled.png' : 'src/icons/privacy_detected.png';
        //chrome.action.setIcon({ path: iconPath });
    }

    calculateRiskPercentage(analysis) {
        let highRiskCount = Array.isArray(analysis.categories) ? analysis.categories.filter(category => category.risk === 'HIGH').length : 0;
        let mediumRiskCount = Array.isArray(analysis.categories) ? analysis.categories.filter(category => category.risk === 'MEDIUM').length : 0;
        return Math.min((highRiskCount * 30 + mediumRiskCount * 20), 100);
    }

    calculateProgressColor(score) {
        let progressColor;
        if (score >= 75) {
            progressColor = '#f28b82'; // Muted red
        } else if (score >= 50) {
            progressColor = '#fbbc04'; // Muted yellow
        } else {
            progressColor = '#81c995'; // Muted green
        }
        return progressColor;
    }

    displayResults(analysis) {
        console.log('Displaying results:', analysis);
        console.log('Displaying results:', analysis);
        console.log('Type of analysis:', typeof analysis);  
        console.log('Keys in analysis:', Object.keys(analysis));
        console.log('Categories in analysis:', analysis.categories);
        this.resultContainer.style.display = 'block';

        // Traffic lights and text
        const lights = document.querySelectorAll('.light');
        lights.forEach(light => light.classList.remove('active'));

        const scoreText = document.querySelector('.score-text');
        const progressBar = document.getElementById('risk-progress');

        // Calculate risk percentage and set progress bar properties
        let riskPercentage = this.calculateRiskPercentage(analysis);
        console.log('Risk percentage:', riskPercentage);
        let progressColor = this.calculateProgressColor(riskPercentage);
        
        switch (analysis.overallRisk) {
            case 'HIGH':
            case 'HIGH_RISK':
                scoreText.textContent = 'High Risk Privacy Policy';
                break;
            case 'MEDIUM':
            case 'MEDIUM_RISK':
                scoreText.textContent = 'Medium Risk Privacy Policy';
                break;
            case 'LOW':
            case 'LOW_RISK':
                scoreText.textContent = 'Low Risk Privacy Policy';
                break;
        }

        // Update progress bar
        progressBar.style.width = `${riskPercentage}%`;
        progressBar.style.backgroundColor = progressColor;

        console.log('Categories', analysis.categories);
        // Populate categories
        const summaryDiv = document.getElementById('summary');
        summaryDiv.innerHTML = analysis.categories.map(category => `
            <div class="category">
                <div class="category-header">
                    <div>${this.formatCategoryName(category.name)}</div>
                    <div class="indicator ${category.risk.toLowerCase()}"></div>
                </div>
                <div class="category-content">${category.details}</div>
            </div>
        `).join('');
        // Add toggle functionality
        const headers = summaryDiv.querySelectorAll('.category-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.classList.toggle('active');
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