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

    calculateRiskPercentage(analysis) {
        let highRiskCount = analysis.categories.filter(category => category.risk === 'HIGH').length;
        let mediumRiskCount = analysis.categories.filter(category => category.risk === 'MEDIUM').length;
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
                //document.querySelector('.light.red').classList.add('active');
                scoreText.textContent = 'High Risk Privacy Policy';
                break;
            case 'MEDIUM':
                //document.querySelector('.light.yellow').classList.add('active');
                scoreText.textContent = 'Medium Risk Privacy Policy';
                break;
            case 'LOW':
                //document.querySelector('.light.green').classList.add('active');
                scoreText.textContent = 'Low Risk Privacy Policy';
                break;
        }
    
        // Update progress bar
        progressBar.style.width = `${riskPercentage}%`;
        progressBar.style.backgroundColor = progressColor;
    
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