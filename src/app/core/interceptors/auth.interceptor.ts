import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { StorageService } from '../../services/storage.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const storage = inject(StorageService);
  const http = inject(HttpClient);

  const token = storage.getItem('token');
  let authReq = req;
  if (token) {
    authReq = addToken(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401(authReq, next, storage, http);
      }
      return throwError(() => error);
    })
  );
};

function handle401(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  storage: StorageService,
  http: HttpClient
): Observable<any> {
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((t) => t !== null),
      take(1),
      switchMap((token) => next(addToken(req, token!)))
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  const refreshToken = storage.getItem('refreshToken');
  if (!refreshToken) {
    isRefreshing = false;
    window.dispatchEvent(new CustomEvent('auth-logout'));
    return throwError(() => new Error('No refresh token'));
  }

  return http.post<{ token: string; refreshToken: string }>(
    `${environment.apiUrl}/api/auth/refresh`,
    { refreshToken }
  ).pipe(
    switchMap(({ token, refreshToken: newRefreshToken }) => {
      isRefreshing = false;
      storage.setItem('token', token);
      storage.setItem('refreshToken', newRefreshToken);
      refreshTokenSubject.next(token);
      return next(addToken(req, token));
    }),
    catchError((err) => {
      isRefreshing = false;
      storage.removeItem('token');
      storage.removeItem('refreshToken');
      window.dispatchEvent(new CustomEvent('auth-logout'));
      return throwError(() => err);
    })
  );
}
