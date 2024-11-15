import { fromFetch } from 'https://esm.sh/rxjs/fetch';
import {
    mergeMap,
    map,
    catchError,
    timeout
} from 'https://esm.sh/rxjs/operators';

export class SearchService {
    constructor(baseUrl = 'https://jsonplaceholder.typicode.com/posts') {
        this.baseUrl = baseUrl;
    }

    search(query) {

        return fromFetch(this.baseUrl).pipe(
            // Add timeout for the request
//            timeout(2000),
            // Handle the response
            mergeMap(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            }),
            // Take first 10 results
            map(posts => posts.slice(0, Math.floor(Math.random() * (30 - 3 + 1)) + 3)),
            // Error handling
            catchError(error => {
                if (error.name === 'TimeoutError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw error;
            })
        );
    }
}
