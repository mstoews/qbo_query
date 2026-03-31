import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-logout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-surface-900 to-surface-500">
      <p class="text-surface-400">Signing out...</p>
    </div>
  `,
})
export class LogoutComponent implements OnInit {
  private readonly authService = inject(AuthService);

  ngOnInit(): void {

    console.log('LogoutComponent initialized, logging out user');
    this.authService.logout();
  }
}
