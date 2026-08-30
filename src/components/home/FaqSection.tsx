'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Truck, CreditCard, MessageCircle } from 'lucide-react';
import { JsonLd, buildFaqSchema } from '@/components/seo/JsonLd';

export const STORE_FAQS = [
  {
    icon: <Truck className="w-5 h-5 text-emerald-600" />,
    question: '¿Cómo funcionan los envíos a Lima y provincias en el Perú?',
    answer: 'En Lima Metropolitana contamos con despachos express en 24 a 48 horas. Para envíos a todas las provincias y departamentos del Perú, trabajamos con agencias líderes y seguras como Olva Courier y Shalom, proporcionando tu número de remito o guía para seguimiento en tiempo real.',
  },
  {
    icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
    question: '¿Cuáles son los métodos de pago aceptados?',
    answer: 'Aceptamos pagos directos y seguros vía Yape, Plin, transferencias bancarias (BCP, BBVA, Interbank, Scotiabank, Banco de la Nación) y pago contraentrega en distritos seleccionados de Lima previa coordinación por WhatsApp.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    question: '¿Los productos cuentan con garantía oficial?',
    answer: 'Sí, todos nuestros productos son 100% nuevos, originales y cuentan con garantía directa ante cualquier falla de fábrica. Brindamos soporte postventa directo y personalizado.',
  },
  {
    icon: <MessageCircle className="w-5 h-5 text-emerald-600" />,
    question: '¿Cómo confirmo mi pedido o solicito asesoría personalizada?',
    answer: 'Puedes hacer tu pedido directamente desde el carrito de compras de nuestra web o hacer clic en el botón de WhatsApp. Un asesor especializado confirmará stock, fotos reales del producto y coordinará los detalles de tu entrega.',
  },
  {
    icon: <HelpCircle className="w-5 h-5 text-emerald-600" />,
    question: '¿Emiten comprobantes de pago (Boleta o Factura)?',
    answer: 'Sí, emitimos boleta de venta y factura electrónica para personas naturales o empresas en todos tus pedidos. Solo indícanos tu RUC o DNI al momento de concretar la compra.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqSchema = buildFaqSchema(STORE_FAQS);

  return (
    <section className="py-16 bg-white border-t border-slate-200">
      {/* FAQ Schema for Google Search Rich Snippets */}
      <JsonLd data={faqSchema} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-200">
            <HelpCircle className="w-4 h-4" />
            <span>Preguntas Frecuentes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Todo lo que necesitas saber antes de comprar
          </h2>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
            Resolvemos tus dudas sobre despachos, garantías y formas de pago para que compres con total tranquilidad en NeXora Store Perú.
          </p>
        </div>

        <div className="space-y-4">
          {STORE_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full py-4 px-5 sm:px-6 flex items-center justify-between text-left gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                      {faq.icon}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 sm:ml-12">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
