import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  kind: string;
  localId: string;
  email: string;
  displayName: string;
  idToken: string;
  registered: boolean;
  refreshToken: string;
  expiresIn: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _isLoggedIn = signal(!!localStorage.getItem('token'));
  private readonly _displayName = signal(localStorage.getItem('displayName') ?? '');
  private readonly _email = signal(localStorage.getItem('email') ?? '');

  readonly isLoggedIn = this._isLoggedIn.asReadonly();
  readonly displayName = this._displayName.asReadonly();
  readonly email = this._email.asReadonly();

  private readonly apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<LoginResponse> {
    this.logout(); // Clear any existing session before logging in
    return this.http
      .post<LoginResponse>(`${this.apiUrl}api/login`, {
        Email: email,
        Password: password,
        returnSecureToken: true,
      })
      .pipe(
        tap((res) => {
          this._isLoggedIn.set(true);
          this._displayName.set(res.displayName);
          this._email.set(res.email);
          localStorage.setItem('token', res.idToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          localStorage.setItem('displayName', res.displayName);
          localStorage.setItem('email', res.email);
        })
      );
  }

  logout(): void {
    this._isLoggedIn.set(false);
    this._displayName.set('');
    this._email.set('');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('displayName');
    localStorage.removeItem('email');
    this.router.navigate(['/login']);
  }
}
