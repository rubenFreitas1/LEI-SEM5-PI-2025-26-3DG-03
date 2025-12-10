import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ModalModule,
  ButtonDirective
} from '@coreui/angular';
import { PrivacyPolicyDTO } from '../../services/privacyPolicy.service';

@Component({
  selector: 'app-privacy-policy-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, ModalModule, ButtonDirective],
  templateUrl: './privacy-policy-modal.html',
  styleUrls: ['./privacy-policy-modal.css']
})
export class PrivacyPolicyModalComponent {
  @Input() set visible(value: boolean) {
    console.log('[Modal Component] visible changed to:', value);
    this._visible = value;
  }
  get visible(): boolean {
    return this._visible;
  }
  private _visible: boolean = false;

  @Input() set policy(value: PrivacyPolicyDTO | null) {
    console.log('[Modal Component] policy changed to:', value);
    this._policy = value;
  }
  get policy(): PrivacyPolicyDTO | null {
    return this._policy;
  }
  private _policy: PrivacyPolicyDTO | null = null;

  @Output() accept = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  onAccept(): void {
    console.log('[Modal Component] Accept clicked');
    this.accept.emit();
  }
}
