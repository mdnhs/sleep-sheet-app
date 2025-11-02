export interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  products: Product[];
}

export interface Product {
  name: string;
  quantity: number;
}

export interface Filters {
  status: string;
  deliveryStatus: string;
  paymentStatus: string;
}
