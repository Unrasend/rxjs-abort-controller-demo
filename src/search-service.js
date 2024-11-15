export class SearchService {
    async search(query, signal) {
        const url = `https://jsonplaceholder.typicode.com/posts`;

        try {
            const response = await fetch(url, { signal });
            const allPosts = await response.json();
            // Take only first 10 records
            return allPosts.slice(0, Math.floor(Math.random() * (30 - 3 + 1)) + 3);
        } catch (error) {
            // Rethrow abort error to handle it in the component
            if (error.name === 'AbortError') {
                throw error;
            }
            console.error('Search failed:', error);
            throw new Error('Failed to fetch search results');
        }
    }
}