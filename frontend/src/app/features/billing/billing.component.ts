import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../core/services/item.service';
import { BillService } from '../../core/services/bill.service';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';
import { Item, Bill, HotelSettings } from '../../core/models';
import { ReceiptComponent } from './receipt.component';

interface CartLine {
  item: Item;
  quantity: number;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReceiptComponent],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css',
})
export class BillingComponent implements OnInit {
  private itemService = inject(ItemService);
  private billService = inject(BillService);
  private settingsService = inject(SettingsService);
  private notify = inject(NotificationService);

  searchTerm = '';
  searchResults = signal<Item[]>([]);
  cart = signal<CartLine[]>([]);

  customerName = '';
  customerPhone = '';
  roomNumber = '';
  discountAmount = 0;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'OTHER' = 'CASH';

  settings = signal<HotelSettings | null>(null);
  generatedBill = signal<Bill | null>(null);
  submitting = signal(false);

  subtotal = computed(() =>
    this.cart().reduce((sum, l) => sum + l.item.price * l.quantity, 0)
  );
  taxTotal = computed(() =>
    this.cart().reduce((sum, l) => sum + (l.item.price * l.quantity * l.item.tax_percent) / 100, 0)
  );
  grandTotal = computed(() =>
    Math.max(0, this.subtotal() + this.taxTotal() - (this.discountAmount || 0))
  );

  ngOnInit() {
    this.settingsService.getAll().subscribe({ next: (res) => this.settings.set(res.data) });
    this.search();
  }

  search() {
    this.itemService.list({ search: this.searchTerm, availableOnly: true, limit: 12 }).subscribe({
      next: (res) => this.searchResults.set(res.data),
    });
  }

  addToCart(item: Item) {
    const existing = this.cart().find((l) => l.item.id === item.id);
    if (existing) {
      this.updateQuantity(item.id, existing.quantity + 1);
    } else {
      this.cart.update((c) => [...c, { item, quantity: 1 }]);
    }
  }

  updateQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeLine(itemId);
      return;
    }
    this.cart.update((c) => c.map((l) => (l.item.id === itemId ? { ...l, quantity } : l)));
  }

  removeLine(itemId: number) {
    this.cart.update((c) => c.filter((l) => l.item.id !== itemId));
  }

  clearCart() {
    this.cart.set([]);
    this.customerName = '';
    this.customerPhone = '';
    this.roomNumber = '';
    this.discountAmount = 0;
  }

  generateBill() {
    if (!this.cart().length) {
      this.notify.error('Add at least one item to the bill.');
      return;
    }
    this.submitting.set(true);
    this.billService
      .create({
        items: this.cart().map((l) => ({ itemId: l.item.id, quantity: l.quantity })),
        customerName: this.customerName || undefined,
        customerPhone: this.customerPhone || undefined,
        roomNumber: this.roomNumber || undefined,
        discountAmount: this.discountAmount || 0,
        paymentMethod: this.paymentMethod,
      })
      .subscribe({
        next: (res) => {
          this.notify.success(`Bill ${res.data.bill_number} generated successfully.`);
          this.generatedBill.set(res.data);
          this.clearCart();
          this.submitting.set(false);
        },
        error: () => this.submitting.set(false),
      });
  }

  closeReceipt() {
    this.generatedBill.set(null);
  }

  printReceipt() {
    window.print();
  }
}
