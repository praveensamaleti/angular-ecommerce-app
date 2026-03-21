import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { selectUser } from '../../store/auth/auth.selectors';

export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectUser).pipe(
    map((user) => {
      if (user?.role === 'admin') return true;
      return router.createUrlTree(['/login']);
    })
  );
};
