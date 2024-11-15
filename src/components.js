export const LoadingSpinner = {
    render(container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;
    }
};

export const SearchStatus = {
    render(container, { query, results, timing }) {
        container.innerHTML = `
            <div class="search-status">
                Found ${results} results for "${query}" (${timing.toFixed(2)}ms)
            </div>
        `;
    }
};