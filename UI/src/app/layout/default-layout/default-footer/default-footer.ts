import { Component } from '@angular/core';
import { FooterComponent } from '@coreui/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-default-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './default-footer.html',
  styleUrl: './default-footer.css',
})
export class DefaultFooter extends FooterComponent {
  constructor() {
    super();
  }
}
