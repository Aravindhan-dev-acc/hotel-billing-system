import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bill, HotelSettings } from '../../core/models';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.css',
})
export class ReceiptComponent {
  @Input({ required: true }) bill!: Bill;
  @Input() settings: HotelSettings | null = null;

  get paperClass(): string {
    return this.settings?.receipt_paper_size === 'A4' ? 'paper-a4' : 'paper-80mm';
  }
}
