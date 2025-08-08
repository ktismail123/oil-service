import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
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
      rememberMe: [false],
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
      setTimeout(() => {
        this.isLoading = false;
        console.log('Login attempt:', this.loginForm.value);
        // Handle successful login
      }, 2000);
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
}
