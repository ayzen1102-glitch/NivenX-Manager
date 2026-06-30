/**
 * NivenX Assistant - Payment Service
 * Manages payment submission, verification, and automation.
 */

import { Payments, Invoices, Orders, UserAccounts, AuditLog, Notifications } from '../database/queries.js';
import { awardOrderPoints } from './accountService.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

/**
 * Submit payment proof for an invoice.
 */
export function submitPaymentProof({ invoiceId, orderId, userId, method, amount, reference, proofUrl }) {
  const invoice = Invoices.findById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);
  if (invoice.status === 'paid') throw new Error('This invoice is already paid.');

  const payment = Payments.create({ invoiceId, orderId, userId, method, amount, reference, proofUrl });

  AuditLog.insert({
    action: 'PAYMENT_PROOF_SUBMITTED',
    actorId: userId,
    targetType: 'invoice',
    targetId: invoiceId,
    details: { method, amount, reference },
  });

  logger.info('PaymentService', `Payment proof submitted for invoice ${invoiceId} by user ${userId}`);
  return Payments.findById(payment.lastInsertRowid);
}

/**
 * Verify a payment (staff action).
 */
export async function verifyPayment(paymentId, staffId, staffTag, client = null) {
  const payment = Payments.findById(paymentId);
  if (!payment) throw new Error(`Payment ${paymentId} not found.`);
  if (payment.status !== 'pending') throw new Error('This payment has already been processed.');

  // Verify payment
  Payments.verify(paymentId, staffId);

  // Mark invoice as paid
  Invoices.markPaid(payment.invoice_id);

  // Update order status to Paid
  const order = Orders.findById(payment.order_id);
  if (order && order.status === 'Awaiting Payment') {
    Orders.updateStatus(payment.order_id, 'Paid');
  }

  // Award points and XP to customer
  awardOrderPoints(payment.user_id, payment.amount, payment.order_id);

  // Update total spent on account
  UserAccounts.addSpending(payment.user_id, payment.amount);

  // Queue notification to customer
  Notifications.queue(payment.user_id, 'payment_confirmed', {
    invoiceId: payment.invoice_id,
    amount: payment.amount,
    orderId: payment.order_id,
  });

  AuditLog.insert({
    action: 'PAYMENT_VERIFIED',
    actorId: staffId,
    actorTag: staffTag,
    targetType: 'payment',
    targetId: String(paymentId),
    details: { invoiceId: payment.invoice_id, amount: payment.amount, userId: payment.user_id },
  });

  logger.success('PaymentService', `Payment ${paymentId} verified by ${staffTag}`);
  return payment;
}

/**
 * Reject a payment (staff action).
 */
export function rejectPayment(paymentId, staffId, staffTag, reason) {
  const payment = Payments.findById(paymentId);
  if (!payment) throw new Error(`Payment ${paymentId} not found.`);

  Payments.reject(paymentId, reason);

  // Queue notification to customer
  Notifications.queue(payment.user_id, 'payment_rejected', {
    invoiceId: payment.invoice_id,
    reason,
  });

  AuditLog.insert({
    action: 'PAYMENT_REJECTED',
    actorId: staffId,
    actorTag: staffTag,
    targetType: 'payment',
    targetId: String(paymentId),
    details: { reason },
  });

  logger.info('PaymentService', `Payment ${paymentId} rejected by ${staffTag}: ${reason}`);
  return payment;
}

/**
 * Get payment methods config (from config.js).
 */
export function getPaymentInstructions() {
  return config.payment?.methods ?? {
    'PayPal': `paypal.me/nivenx`,
    'Crypto (BTC)': `Contact staff for wallet address`,
    'Bank Transfer': `Contact staff for bank details`,
  };
}
