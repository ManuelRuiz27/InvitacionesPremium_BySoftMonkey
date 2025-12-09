import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side error
                errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

                // Handle specific error codes
                switch (error.status) {
                    case 401:
                        // Unauthorized - redirect to login
                        router.navigate(['/auth/login']);
                        errorMessage = 'Session expired. Please login again.';
                        break;
                    case 403:
                        // Forbidden
                        errorMessage = 'You do not have permission to access this resource.';
                        break;
                    case 404:
                        errorMessage = 'Resource not found.';
                        break;
                    case 500:
                        errorMessage = 'Internal server error. Please try again later.';
                        break;
                }
            }

            console.error(errorMessage);
            return throwError(() => new Error(errorMessage));
        })
    );
};
