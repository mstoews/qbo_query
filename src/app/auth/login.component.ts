import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-surface-900 to-surface-500">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-surface-800 p-8 rounded-2xl shadow-lg w-full max-w-sm flex flex-col gap-4">
        <h1 class="text-2xl font-bold text-surface-0 text-center">Sign In</h1>

        @if (errorMessage()) {
          <p class="text-red-400 text-sm text-center">{{ errorMessage() }}</p>
        }

        <input formControlName="email" type="email" placeholder="Email"
          class="p-3 rounded-lg bg-surface-700 text-surface-0 border border-surface-600 focus:outline-none focus:border-primary-500" />
        <input formControlName="password" type="password" placeholder="Password"
          class="p-3 rounded-lg bg-surface-700 text-surface-0 border border-surface-600 focus:outline-none focus:border-primary-500" />
        <button type="submit" [disabled]="form.invalid || loading()"
          class="p-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ loading() ? 'Signing in...' : 'Login' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Invalid email or password.');
      },
    });
  }
}
