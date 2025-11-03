import { Component } from '@angular/core';
import { FooterComponent } from '@coreui/angular'

@Component({
  selector: 'app-default-footer',
  imports: [],
  templateUrl: './default-footer.html',
  styleUrl: './default-footer.css',
})
export class DefaultFooter extends FooterComponent{
  constructor(){
    super();
  }
}
