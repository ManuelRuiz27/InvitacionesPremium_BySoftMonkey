import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models';
import { MockDataService } from './mock-data.service';

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser$: Observable<User | null>;
    private tokenKey = 'auth_token';
    private useMockData = false; // Toggle to switch between mock and real API

    constructor(
        private http: HttpClient,
        private router: Router,
        private mockDataService: MockDataService
    ) {
        const storedUser = this.getStoredUser();
        this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
        this.currentUser$ = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    public get isAuthenticated(): boolean {
        return !!this.getToken() && !!this.currentUserValue;
    }

    public get userRole(): UserRole | null {
        return this.currentUserValue?.role || null;
    }

    login(email: string, password: string): Observable<LoginResponse> {
        if (this.useMockData) {
            return this.mockDataService.login(email, password).pipe(
                tap(response => {
                    this.setToken(response.token);
                    this.setUser(response.user);
                    this.currentUserSubject.next(response.user);
                })
            );
        }

        return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
            .pipe(
                tap(response => {
                    this.setToken(response.token);
                    this.setUser(response.user);
                    this.currentUserSubject.next(response.user);
                })
            );
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem('current_user');
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    private setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    private setUser(user: User): void {
        localStorage.setItem('current_user', JSON.stringify(user));
    }

    private getStoredUser(): User | null {
        const userStr = localStorage.getItem('current_user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    hasRole(role: UserRole): boolean {
        return this.currentUserValue?.role === role;
    }

    hasAnyRole(roles: UserRole[]): boolean {
        return roles.some(role => this.hasRole(role));
    }
}
