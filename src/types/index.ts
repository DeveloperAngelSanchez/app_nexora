export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  price: number;
  regularPrice: number;
  discountPercentage: number;
  currency: string;
  symbol: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  description: string;
  features: string[];
  variants?: ProductVariant[];
  sourceUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  icon?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedModel?: string;
}

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  district: string;
  address: string;
  reference?: string;
  notes?: string;
  paymentMethod: 'whatsapp_yape_plin' | 'contraentrega' | 'transferencia' | 'card';
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: OrderCustomer;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
  createdAt: string;
}
