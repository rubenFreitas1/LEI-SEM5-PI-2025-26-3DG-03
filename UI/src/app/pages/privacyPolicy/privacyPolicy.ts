import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PrivacyPolicyService } from '../../services/privacyPolicy.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './privacyPolicy-general.html',
  styleUrls: ['./privacyPolicy-general.css']
})
export class PrivacyPolicyComponent implements OnInit {
  policyContent: string = '';
  policyDate: string = '';

  constructor(private privacyPolicyService: PrivacyPolicyService) {}

  ngOnInit(): void {
    this.privacyPolicyService.getCurrentPolicy().subscribe(policy => {
      this.policyContent = policy.content;
      this.policyDate = policy.createdAt;
    });
  }
}
