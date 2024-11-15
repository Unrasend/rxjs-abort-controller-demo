import { SearchService } from './search-service.js';
import { LoadingSpinner, SearchStatus } from './components.js';

export class AbortControllerSearch {
    constructor() {
        this.controller = null;
        this.searchService = new SearchService();
        this.searchStartTime = 0;
        this.debounceTimeout = null;
        this.setupDOM();
        this.bindEvents();
        LoadingSpinner.render(this.loadingIndicator);
        this.loadingIndicator.classList.add('hidden');
    }

    setupDOM() {
        const template = `
            <div class="search-widget">
                <div class="search-input-wrapper">
                    <input type="text" placeholder="Search..." class="search-input">
                    <div class="loading-indicator hidden"></div>
                </div>
                <div class="search-status-container"></div>
                <div class="results-container"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', template);

        this.searchInput = document.querySelector('.search-input');
        this.resultsContainer = document.querySelector('.results-container');
        this.loadingIndicator = document.querySelector('.loading-indicator');
        this.searchStatus = document.querySelector('.search-status-container');
    }

    bindEvents() {
        this.searchInput.addEventListener('input', (e) => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }

            this.debounceTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });
    }

    async handleSearch(query) {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }

        if (!query) {
            this.resultsContainer.innerHTML = '';
            this.searchStatus.innerHTML = '';
            return;
        }

        this.controller = new AbortController();
        this.loadingIndicator.classList.remove('hidden');
        this.searchStartTime = performance.now();

        const currentController = this.controller

        try {
            const results = await this.searchService.search(query, currentController.signal);

            if (this.controller !== currentController || currentController.signal.aborted) {
                console.log('Search aborted or superseded');
                return;
            }

            if (this.controller.signal.aborted) return;

            const searchTime = performance.now() - this.searchStartTime;
            this.renderResults(results);
            SearchStatus.render(this.searchStatus, {
                query,
                results: results.length,
                timing: searchTime
            });

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search aborted');
            } else {
                this.renderError(error);
            }
        } finally {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    renderResults(results) {
        this.resultsContainer.innerHTML = results
            .map(result => `
                <div class="result-item">
                    <h3>${result.title}</h3>
                    <p>${result.body}</p>
                </div>
            `)
            .join('');
    }

    renderError(error) {
        this.resultsContainer.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span>${error.message}</span>
                <button class="retry-button">Retry</button>
            </div>
        `;

        const retryButton = this.resultsContainer.querySelector('.retry-button');
        retryButton?.addEventListener('click', () => {
            this.handleSearch(this.searchInput.value);
        });
    }

    cleanup() {
        if (this.controller) {
            this.controller.abort();
        }
        document.querySelector('.search-widget')?.remove();
    }
}
