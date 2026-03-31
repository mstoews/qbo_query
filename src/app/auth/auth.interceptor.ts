import { type HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('localhost') || req.url.includes('api/login')) {
    const token = localStorage.getItem('token');
    console.log(token);
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      //console.log('Token added to request headers', token);
    }
  }
  return next(req);
};
