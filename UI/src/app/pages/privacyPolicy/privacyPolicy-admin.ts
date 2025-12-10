import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrivacyPolicyService, PrivacyPolicyDTO } from '../../services/privacyPolicy.service';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  FormLabelDirective,
  AlertComponent
} from '@coreui/angular';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-privacy-policy-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    FormLabelDirective,
    AlertComponent,
    QuillModule
  ],
  templateUrl: './privacyPolicy-admin.html',
  styleUrls: ['./privacyPolicy-admin.css']
})
export class PrivacyPolicyAdminComponent implements OnInit {
  policyHistory: PrivacyPolicyDTO[] = [];
  currentPolicy: PrivacyPolicyDTO | null = null;
  newPolicyContent: string = '';
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  constructor(private privacyPolicyService: PrivacyPolicyService) {}

  ngOnInit(): void {
    this.loadCurrentPolicy();
    this.loadPolicyHistory();
  }

  loadCurrentPolicy(): void {
    this.privacyPolicyService.getCurrentPolicy().subscribe({
      next: (policy) => {
        this.currentPolicy = policy;
      },
      error: (err) => {
        console.error('Error loading current policy:', err);
      }
    });
  }

  loadPolicyHistory(): void {
    this.loading = true;
    this.privacyPolicyService.getPolicyHistory().subscribe({
      next: (history) => {
        this.policyHistory = history;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading policy history:', err);
        this.errorMessage = 'Failed to load policy history.';
        this.loading = false;
      }
    });
  }

  createNewPolicy(): void {
    if (!this.newPolicyContent.trim()) {
      this.errorMessage = 'Policy content cannot be empty.';
      return;
    }

    if (this.newPolicyContent.trim().length < 10) {
      this.errorMessage = 'Policy content must be at least 10 characters long.';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.privacyPolicyService.createPolicy(this.newPolicyContent).subscribe({
      next: (newPolicy) => {
        this.successMessage = 'Privacy Policy successfully created!';
        this.newPolicyContent = '';
        this.loadCurrentPolicy();
        this.loadPolicyHistory();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error creating policy:', err);
        this.errorMessage = 'Failed to create new policy. Please try again.';
        this.loading = false;
      }
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
