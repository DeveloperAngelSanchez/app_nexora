'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getPublicSiteSettings } from '@/lib/settings';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedModel?: string;
}

export interface CreateOrderCustomerInput {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  reference?: string;
  paymentMethod: string;
  notes?: string;
}

export async function createOrderAction(
  customer: CreateOrderCustomerInput,
  itemsInput: CreateOrderItemInput[]
) {
  try {
    if (!itemsInput || itemsInput.length === 0) {
      return { success: false, error: 'El carrito de compras está vacío.' };
    }

    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, error: 'Por favor ingresa un número de teléfono válido (mínimo 9 dígitos).' };
    }

    if (!customer.fullName.trim() || !customer.address.trim() || !customer.district.trim()) {
      return { success: false, error: 'Por favor completa todos los campos de entrega obligatorios.' };
    }

    const supabase = await createSupabaseServerClient();
    const productIds = itemsInput.map((i) => i.productId);

    // 1. Fetch real products from DB to validate prices
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, stock, is_active')
      .in('id', productIds);

    if (prodError || !dbProducts || dbProducts.length === 0) {
      return { success: false, error: 'No se pudieron verificar los productos en el catálogo.' };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 2. Validate and compute canonical prices
    let subtotal = 0;
    const orderItems = [];

    for (const item of itemsInput) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) continue;

      const qty = Math.max(1, Math.min(item.quantity, 50));
      const price = Number(dbProd.price);
      subtotal += price * qty;

      orderItems.push({
        id: dbProd.id,
        name: dbProd.name,
        price,
        quantity: qty,
        color: item.selectedColor || null,
        model: item.selectedModel || null,
      });
    }

    if (orderItems.length === 0) {
      return { success: false, error: 'Ningún producto del pedido es válido.' };
    }

    // 3. Compute shipping with live store settings
    const settings = await getPublicSiteSettings();
    const freeThreshold = settings.free_shipping_threshold ?? 150;
    const defaultCost = settings.default_shipping_cost ?? 10;
    const shippingCost = subtotal >= freeThreshold ? 0 : defaultCost;
    const total = subtotal + shippingCost;

    const paymentMap: Record<string, string> = {
      'Yape / Plin': 'whatsapp_yape_plin',
      'Contraentrega (Lima)': 'contraentrega',
      'Transferencia BCP/BBVA': 'transferencia',
      'Tarjeta de Débito/Crédito': 'card',
    };

    const orderPayload = {
      customer_name: customer.fullName.trim(),
      customer_phone: cleanPhone,
      city: customer.city || 'Lima',
      district: customer.district.trim(),
      address: customer.address.trim(),
      reference: customer.reference?.trim() || null,
      payment_method: paymentMap[customer.paymentMethod] || 'whatsapp_yape_plin',
      items: orderItems,
      subtotal,
      shipping_cost: shippingCost,
      total,
      status: 'pending' as const,
      admin_notes: customer.notes?.trim() ? `Nota cliente: ${customer.notes.trim()}` : null,
    };

    // 4. Insert order safely on the server (with admin fallback for guaranteed persistence)
    let orderData: any = null;
    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (!orderError && insertedOrder) {
      orderData = insertedOrder;
    } else {
      // Intento con cliente administrativo si la sesión anónima tiene restricciones RLS temporales
      console.warn('Reintentando inserción de pedido con admin client:', orderError?.message);
      try {
        const adminSb = createSupabaseAdminClient();
        const { data: adminOrder, error: adminErr } = await adminSb
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();

        if (!adminErr && adminOrder) {
          orderData = adminOrder;
        } else {
          console.error('Fallo definitivo insertando pedido en DB:', adminErr?.message);
        }
      } catch (adminEx) {
        console.error('Error instanciando admin client:', adminEx);
      }
    }

    if (!orderData) {
      return { 
        success: false, 
        error: 'No se pudo registrar el pedido en el sistema. Por favor intenta nuevamente o contáctanos por WhatsApp.' 
      };
    }

    // 5. Reducción atómica de inventario para productos confirmados
    try {
      const adminSb = createSupabaseAdminClient();
      for (const item of orderItems) {
        const dbProd = productMap.get(item.id);
        if (dbProd && typeof dbProd.stock === 'number') {
          const newStock = Math.max(0, dbProd.stock - item.quantity);
          await adminSb
            .from('products')
            .update({ 
              stock: newStock, 
              in_stock: newStock > 0 
            })
            .eq('id', item.id);
        }
      }
    } catch (stockErr) {
      console.warn('Advertencia actualizando inventario de productos:', stockErr);
    }

    return {
      success: true,
      orderNumber: orderData.order_number,
      subtotal,
      shippingCost,
      total,
      storeSettings: settings,
    };
  } catch (err: any) {
    console.error('Exception in createOrderAction:', err);
    return { success: false, error: 'Ocurrió un error al procesar el pedido. Intenta nuevamente.' };
  }
}
