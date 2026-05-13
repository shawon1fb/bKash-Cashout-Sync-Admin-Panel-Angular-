import { Component, inject, signal, computed, ElementRef, viewChildren, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { PhonePipe } from '../../../shared/pipes/phone.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ToastComponent, PhonePipe],
  template: `
    <div class="auth-wrap">
      <div style="position:absolute;top:24px;left:24px;display:flex;align-items:center;gap:9px;font-weight:600">
        <div class="brand-glyph" style="width:28px;height:28px">b</div>
        <div>
          <div style="font-size:14px;letter-spacing:-0.01em">Cashout Sync</div>
          <div style="font-size:10px;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase">Admin Console</div>
        </div>
      </div>

      <div class="auth-card">
        <div style="margin-bottom:24px">
          @if (step() === 'phone') {
            <h1 style="font-size:22px;font-weight:600;margin:0;letter-spacing:-0.02em">Sign in</h1>
            <p style="color:var(--text-muted);font-size:13px;margin-top:6px;margin-bottom:0">We'll send a 6-digit code to your bKash-registered number.</p>
          } @else {
            <h1 style="font-size:22px;font-weight:600;margin:0;letter-spacing:-0.02em">Enter verification code</h1>
            <p style="color:var(--text-muted);font-size:13px;margin-top:6px;margin-bottom:0">
              Sent to <span style="color:var(--text-2);font-family:var(--font-mono)">{{ phone() | phone }}</span>
              <button (click)="backToPhone()" style="margin-left:8px;color:var(--brand-2);font-size:12px">Change</button>
            </p>
          }
        </div>

        @if (step() === 'phone') {
          <div>
            <label class="label">Phone number</label>
            <div style="position:relative">
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--text-muted);pointer-events:none">+880</span>
              <input class="input" style="padding-left:50px;font-family:var(--font-mono)"
                [value]="phone()"
                (input)="onPhoneInput($event)"
                (keydown.enter)="sendOtp()"
                placeholder="01XXXXXXXXX"
                maxlength="11"
                inputmode="numeric"/>
            </div>
            @if (phoneError()) {
              <div style="color:var(--danger);font-size:12px;margin-top:6px">{{ phoneError() }}</div>
            }
            <button (click)="sendOtp()" [disabled]="!phoneOk() || loading()" class="btn btn-primary"
              style="width:100%;margin-top:18px;justify-content:center;padding:11px 14px"
              [style.opacity]="(!phoneOk() || loading()) ? 0.6 : 1">
              @if (loading()) { Sending… } @else { Send code
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              }
            </button>
          </div>
        } @else {
          <div>
            <label class="label">6-digit OTP</label>
            <div class="otp-row" (paste)="onOtpPaste($event)">
              @for (v of otp(); track $index; let i = $index) {
                <input #otpInput
                  class="otp-cell" [class.filled]="!!v"
                  [value]="v"
                  (input)="onOtpChange(i, $event)"
                  (keydown)="onOtpKey(i, $event)"
                  maxlength="1"
                  inputmode="numeric"/>
              }
            </div>
            @if (otpError()) {
              <div style="color:var(--danger);font-size:12px;margin-top:8px">{{ otpError() }}</div>
            }
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px">
              <span style="color:var(--text-muted)">
                @if (secondsLeft() > 0) {
                  Expires in <span style="font-family:var(--font-mono);color:var(--text-2)">{{ timerLabel() }}</span>
                } @else {
                  Code expired
                }
              </span>
              @if (secondsLeft() <= 0) {
                <button (click)="sendOtp()" style="color:var(--brand-2);font-weight:500">Resend</button>
              }
            </div>
            <button (click)="verify()" [disabled]="!otpFull() || loading()" class="btn btn-primary"
              style="width:100%;margin-top:18px;justify-content:center;padding:11px 14px"
              [style.opacity]="(!otpFull() || loading()) ? 0.6 : 1">
              @if (loading()) { Verifying… } @else { Verify &amp; sign in
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </button>
          </div>
        }
        <div style="margin-top:20px;text-align:center;font-size:11px;color:var(--text-dim)">By signing in you agree to the platform terms.</div>
      </div>

      <div style="position:absolute;bottom:18px;font-size:11px;color:var(--text-dim);display:flex;gap:18px">
        <span>v 0.21.4 · Internal build</span>
        <span style="display:inline-flex;align-items:center;gap:6px"><span class="live-dot"></span> All systems operational</span>
      </div>
    </div>
    <app-toast />
  `,
})
export class LoginPage {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private toast  = inject(ToastService);

  readonly step       = signal<'phone' | 'otp'>('phone');
  readonly phone      = signal('');
  readonly otp        = signal(['', '', '', '', '', '']);
  readonly phoneError = signal('');
  readonly otpError   = signal('');
  readonly loading    = signal(false);
  readonly secondsLeft = signal(300);

  private timerRef: ReturnType<typeof setInterval> | null = null;

  otpInputs = viewChildren<ElementRef>('otpInput');

  readonly phoneOk  = computed(() => /^01[3-9]\d{8}$/.test(this.phone()));
  readonly otpFull  = computed(() => this.otp().every(v => !!v));
  readonly timerLabel = computed(() => {
    const s = this.secondsLeft();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });

  constructor() {
    effect(() => {
      if (this.step() === 'otp') {
        setTimeout(() => {
          const inputs = this.otpInputs();
          if (inputs?.length) (inputs[0].nativeElement as HTMLInputElement).focus();
        }, 100);
      }
    });
  }

  onPhoneInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    this.phone.set(v);
    this.phoneError.set('');
  }

  sendOtp(): void {
    this.phoneError.set('');
    if (!this.phoneOk()) { this.phoneError.set('Enter a valid Bangladeshi number'); return; }
    this.loading.set(true);

    this.auth.sendOtp(this.phone()).subscribe({
      next: () => this.afterOtpSent(),
      error: (err) => {
        this.phoneError.set(err?.error?.message ?? 'Failed to send OTP. Try again.');
        this.loading.set(false);
      },
    });
  }

  private afterOtpSent(): void {
    this.secondsLeft.set(300);
    this.step.set('otp');
    this.loading.set(false);
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timerRef) clearInterval(this.timerRef);
    this.timerRef = setInterval(() => {
      const s = this.secondsLeft() - 1;
      this.secondsLeft.set(s);
      if (s <= 0 && this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; }
    }, 1000);
  }

  backToPhone(): void {
    this.step.set('phone');
    this.otp.set(['', '', '', '', '', '']);
    if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; }
  }

  verify(): void {
    const code = this.otp().join('');
    this.otpError.set('');
    if (code.length !== 6) { this.otpError.set('Enter all 6 digits'); return; }
    this.loading.set(true);

    this.auth.verifyOtp(this.phone(), code).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.otpError.set(err?.error?.message ?? 'Invalid OTP. Please try again.');
        this.loading.set(false);
      },
    });
  }

  onOtpChange(i: number, e: Event): void {
    const v = (e.target as HTMLInputElement).value.slice(-1);
    if (v && !/^\d$/.test(v)) { (e.target as HTMLInputElement).value = this.otp()[i]; return; }
    const next = [...this.otp()];
    next[i] = v;
    this.otp.set(next);
    if (v && i < 5) {
      const inputs = this.otpInputs();
      (inputs[i + 1]?.nativeElement as HTMLInputElement)?.focus();
    }
    if (i === 5 && v && next.every(x => x)) {
      setTimeout(() => this.verify(), 100);
    }
  }

  onOtpKey(i: number, e: KeyboardEvent): void {
    if (e.key === 'Backspace' && !this.otp()[i] && i > 0) {
      const inputs = this.otpInputs();
      (inputs[i - 1]?.nativeElement as HTMLInputElement)?.focus();
    }
  }

  onOtpPaste(e: ClipboardEvent): void {
    const v = e.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) ?? '';
    if (v.length) {
      e.preventDefault();
      const next = v.padEnd(6, '').split('').slice(0, 6);
      while (next.length < 6) next.push('');
      this.otp.set(next);
      const lastIdx = Math.min(v.length, 5);
      const inputs = this.otpInputs();
      (inputs[lastIdx]?.nativeElement as HTMLInputElement)?.focus();
    }
  }
}
