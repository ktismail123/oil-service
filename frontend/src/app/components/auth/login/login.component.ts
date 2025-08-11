import { ApiService } from './../../../services/api.service';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  focusedField: string | null = null;
  showPassword = false;
  isLoading = false;
  showAssistant = false;

  features = [
    {
      icon: '⚡',
      title: 'Lightning Fast Service',
      description:
        'Quick oil changes completed in 15 minutes or less with premium quality oils.',
    },
    {
      icon: '🛡️',
      title: 'Quality Guarantee',
      description:
        'We use only top-tier automotive oils and filters with full service warranty.',
    },
    {
      icon: '🔧',
      title: 'Expert Technicians',
      description:
        'Certified professionals with years of experience in automotive maintenance.',
    },
  ];

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['manager', [Validators.required]], // Default to manager
      rememberMe: [false]
    });
  }

  ngOnInit() {
    // Component initialization
  }

  onFieldFocus(field: string) {
    this.focusedField = field;
  }

  onFieldBlur() {
    this.focusedField = null;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      // Simulate authentication
     this.apiService.login(this.loginForm.value)
     .pipe(
      take(1),
      finalize(() => {
        this.isLoading = false;
      })
     )
     .subscribe({
      next:(res => {
        if(res.success){
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('userData', JSON.stringify(res.data?.userData));
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || 'select-service';
          this.router.navigateByUrl(returnUrl);
        }
      }),
      
     })
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  socialLogin(provider: string) {
    console.log(`Social login with ${provider}`);
    // Implement social login logic
  }

  goToSignup() {
    console.log('Navigate to signup');
    // Implement navigation to signup page
  }

  toggleAssistant() {
    this.showAssistant = !this.showAssistant;
  }

  selectRole(role: string) {
    this.loginForm.patchValue({ role: role });
  }
}
