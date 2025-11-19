import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timeout } from 'rxjs';
import { OrganizationService } from '../../services/organization.service';
import { RepresentativeService } from '../../services/representative.service';
import { ShippingAgentOrganizationModel, ShippingAgentOrganizationWithRepresentativeModel, RepresentativeModel } from '../../models/organization.model';

@Component({
  selector: 'app-organization',
  imports: [CommonModule, FormsModule],
  templateUrl: './organization.html',
  styleUrl: './organization.css',
})
export class Organization implements OnInit, OnDestroy {
  organizations: ShippingAgentOrganizationWithRepresentativeModel[] = [];
  filteredOrganizations: ShippingAgentOrganizationWithRepresentativeModel[] = [];
  selectedOrganization: ShippingAgentOrganizationWithRepresentativeModel | null = null;
  selectedOrganizationRepresentatives: RepresentativeModel[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newOrganization: ShippingAgentOrganizationModel = {
    code: '',
    legalName: '',
    alternativeName: '',
    address: '',
    taxNumber: ''
  };
  newRepresentative: RepresentativeModel = {
    name: '',
    citizenId: '',
    nationality: '',
    email: '',
    phoneNumber: ''
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editOrganization: ShippingAgentOrganizationModel = {
    code: '',
    legalName: '',
    alternativeName: '',
    address: '',
    taxNumber: ''
  };
  editRepresentative: RepresentativeModel = {
    name: '',
    citizenId: '',
    nationality: '',
    email: '',
    phoneNumber: ''
  };
  editIncludeRepresentative: boolean = false;
  hasExistingRepresentative: boolean = false;
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditOrganization: ShippingAgentOrganizationModel | null = null;
  originalEditRepresentative: RepresentativeModel | null = null;

  countries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CV', name: 'Cabo Verde' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'CD', name: 'Democratic Republic of the Congo' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'CI', name: 'Ivory Coast' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KP', name: 'North Korea' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
  ];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private searchClearTimer: any = null;

  constructor(
    private organizationService: OrganizationService,
    private representativeService: RepresentativeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrganizations();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.handleSearchTermChange(searchTerm);
        this.performSearch(searchTerm);
      });
  }

  loadOrganizations() {
    this.isLoading = true;
    this.organizationService.getAllOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (organizations) => {
          this.organizations = organizations;
          this.filteredOrganizations = [...this.organizations];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading organizations. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading organizations:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredOrganizations = [...this.organizations];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }

    const localResults = this.organizations.filter(org =>
      org.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.alternativeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.representativeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.filteredOrganizations = localResults;

    if (localResults.length === 0) {
      this.statusHiding = false;
      this.statusMessage = `No results found for "${searchTerm}"`;
      this.statusMessageType = 'error';
    } else {
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
    }
  }

  clearStatusMessage() {
    if (!this.statusMessage) return;
    this.statusHiding = true;
    setTimeout(() => {
      this.statusMessage = '';
      this.statusMessageType = '';
      this.statusHiding = false;
    }, 220);
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredOrganizations = [...this.organizations];
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredOrganizations = [...this.organizations];
    this.searchSubject$.next(this.searchTerm);
  }

  private handleSearchTermChange(term: string) {
    if (this.searchClearTimer) {
      clearTimeout(this.searchClearTimer);
      this.searchClearTimer = null;
    }
    if (!term || !term.trim()) {
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.searchClearTimer = setTimeout(() => {
          this.clearStatusMessage();
          this.searchClearTimer = null;
        }, 2000);
      }
    }
  }

  selectOrganization(organization: ShippingAgentOrganizationWithRepresentativeModel) {
    if (this.selectedOrganization?.id === organization.id) {
      this.selectedOrganization = null;
      this.selectedOrganizationRepresentatives = [];
    } else {
      this.selectedOrganization = organization;
      this.selectedOrganizationRepresentatives = [];

      // load representatives for the selected organization by its legal name
      const orgName = organization.legalName || organization.alternativeName || organization.code;
      if (orgName) {
        this.representativeService.getRepresentativesByOrganization(orgName)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (reps) => {
              this.selectedOrganizationRepresentatives = reps || [];
            },
            error: (err) => {
              console.error('Error loading representatives for organization', orgName, err);
              this.selectedOrganizationRepresentatives = [];
            }
          });
      }
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewOrganization();
  }

  onUpdate() {
    if (this.selectedOrganization) {
      this.showEditModal = true;
      this.resetEditOrganization();
      this.editOrganization = { ...this.selectedOrganization };
      this.originalEditOrganization = { ...this.editOrganization };
    } else {
      alert('Please select an organization to update.');
    }
  }

  refreshList() {
    this.loadOrganizations();
    this.selectedOrganization = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewOrganization() {
    this.newOrganization = {
      code: '',
      legalName: '',
      alternativeName: '',
      address: '',
      taxNumber: ''
    };
    this.newRepresentative = {
      name: '',
      citizenId: '',
      nationality: '',
      email: '',
      phoneNumber: ''
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewOrganization();
    this.isCreating = false;
  }

  onSaveNewOrganization() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidOrganization()) {
      this.modalErrorMessage = 'Please fill in all required fields (code, legal name, address, tax number).';
      return;
    }

    if (!this.isValidRepresentative()) {
      this.modalErrorMessage = 'Please fill in all required representative fields (name, citizen ID, nationality, email, phone).';
      return;
    }

    this.isCreating = true;

    // Combine organization and representative data into a single object
    const organizationWithRepresentative: ShippingAgentOrganizationWithRepresentativeModel = {
      code: this.newOrganization.code,
      legalName: this.newOrganization.legalName,
      alternativeName: this.newOrganization.alternativeName,
      address: this.newOrganization.address,
      taxNumber: this.newOrganization.taxNumber,
      representativeName: this.newRepresentative.name,
      representativeCitizenId: this.newRepresentative.citizenId,
      representativeNationality: this.newRepresentative.nationality,
      representativeEmail: this.newRepresentative.email,
      representativePhoneNumber: this.newRepresentative.phoneNumber
    };

    this.organizationService.createOrganization(organizationWithRepresentative)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdOrganization) => {
          this.handleCreateSuccess(createdOrganization);
        },
        error: (error) => {
          console.error('Error creating organization:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateSuccess(createdOrganization: ShippingAgentOrganizationWithRepresentativeModel, warningMessage?: string) {
    this.closeCreateModal();
    this.statusHiding = false;
    this.statusMessage = warningMessage || `Organization "${createdOrganization.legalName}" created successfully!`;
    this.statusMessageType = warningMessage ? 'error' : 'success';
    setTimeout(() => this.clearStatusMessage(), 3000);
    this.loadOrganizations();
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};

    let errorMessage = 'Error creating organization. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidOrganization(): boolean {
    return !!(this.newOrganization.code?.trim() &&
              this.newOrganization.legalName?.trim() &&
              this.newOrganization.address?.trim() &&
              this.newOrganization.taxNumber?.trim());
  }

  private isValidRepresentative(): boolean {
    return !!(this.newRepresentative.name?.trim() &&
              this.newRepresentative.citizenId?.trim() &&
              this.newRepresentative.nationality?.trim() &&
              this.newRepresentative.email?.trim() &&
              this.newRepresentative.phoneNumber?.trim());
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditOrganization() {
    this.editOrganization = {
      code: '',
      legalName: '',
      alternativeName: '',
      address: '',
      taxNumber: ''
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditOrganization = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditOrganization();
    this.isEditing = false;
  }

  onSaveEditOrganization() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditOrganization()) {
      this.editModalErrorMessage = 'Please fill in all required fields (legal name, address, tax number).';
      return;
    }

    if (!this.selectedOrganization?.id) {
      this.editModalErrorMessage = 'No organization selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    const updatePayload = {
      code: this.editOrganization.code,
      legalName: this.editOrganization.legalName,
      alternativeName: this.editOrganization.alternativeName,
      address: this.editOrganization.address,
      taxNumber: this.editOrganization.taxNumber
    };

    this.organizationService.updateOrganization(this.selectedOrganization.id, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleEditSuccess();
        },
        error: (error) => {
          console.error('Error updating organization:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  private handleEditSuccess() {
    this.closeEditModal();
    this.statusHiding = false;
    this.statusMessage = 'Organization updated successfully!';
    this.statusMessageType = 'success';
    setTimeout(() => this.clearStatusMessage(), 3000);
    this.loadOrganizations();
    this.isEditing = false;
  }

  isEditDirty(): boolean {
    if (!this.originalEditOrganization) return false;

    const orig = this.originalEditOrganization;
    const curr = this.editOrganization;

    return (orig.legalName || '').trim() !== (curr.legalName || '').trim() ||
           (orig.alternativeName || '').trim() !== (curr.alternativeName || '').trim() ||
           (orig.address || '').trim() !== (curr.address || '').trim() ||
           (orig.taxNumber || '').trim() !== (curr.taxNumber || '').trim();
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};

    let errorMessage = 'Error updating organization. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditOrganization(): boolean {
    return !!(this.editOrganization.legalName?.trim() &&
              this.editOrganization.address?.trim() &&
              this.editOrganization.taxNumber?.trim());
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
