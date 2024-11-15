import { fromEvent, Subject, of, forkJoin } from 'https://esm.sh/rxjs';
import { debounceTime, switchMap, takeUntil, distinctUntilChanged, tap, map } from 'https://esm.sh/rxjs/operators';
import { SearchService } from './rx-search-service.js';
import { LoadingSpinner, SearchStatus } from './components.js';

export class RxJSSearch {
    constructor() {
        this.destroy$ = new Subject();
        this.searchService = new SearchService();
        this.setupDOM();
        this.setupSearchSubscription();
    }

    setupDOM() {
        const template = `
            <div class="search-widget">
                <div class="search-input-wrapper">
                    <input type="text" placeholder="Search posts..." class="search-input">
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
        LoadingSpinner.render(this.loadingIndicator);
        this.loadingIndicator.classList.add('hidden');
        this.searchStatus = document.querySelector('.search-status-container');
    }

    setupSearchSubscription() {
        fromEvent(this.searchInput, 'input').pipe(
            map(e => e.target.value.trim()),
            debounceTime(300),
            distinctUntilChanged(),
            tap(() => this.loadingIndicator.classList.remove('hidden')),
            map(query => [query, performance.now()]),
            switchMap(([query, startTime]) => forkJoin([query ? this.searchService.search(query) : of([]), of(query), of(startTime)])),
            tap(console.log),
            takeUntil(this.destroy$),
        ).subscribe({ next: data => this.onDataLoaded(data) });
    }

    onDataLoaded([results, query, startTime]) {
        this.loadingIndicator.classList.add('hidden');
        if (!query || results?.length === 0) {
            this.clearResults();
        } else {
            this.renderResults(results);
            this.renderSearchStatus({
                query,
                results: results.length,
                timing: performance.now() - startTime
            });
        }
    }

    clearResults() {
        this.resultsContainer.innerHTML = '';
        this.searchStatus.innerHTML = '';
    }

    renderSearchStatus(status) {
        this.searchStatus.innerHTML = `
            <div class="search-status">
                Found ${status.results} results for "${status.query}"
                (${status.timing.toFixed(2)}ms)
            </div>
        `;
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
                <span>${error}</span>
                <button class="retry-button">Retry</button>
            </div>
        `;

        const retryButton = this.resultsContainer.querySelector('.retry-button');
        retryButton?.addEventListener('click', () => {
            const currentValue = this.searchInput.value;
            // Trigger a new search by forcing input event
            this.searchInput.value = '';
            this.searchInput.value = currentValue;
        });
    }

    cleanup() {
        this.destroy$.next();
        this.destroy$.complete();
        document.querySelector('.search-widget')?.remove();
    }
}