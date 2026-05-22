
import { aliunMcpService } from './mcp/aliun-mcp.service';
import { ErrorHandler } from '@/utils/ErrorHandler';

/**
 * DocumentService
 * Wrapper for MCP document generation.
 */
export const documentService = {

  /**
   * Creates a voucher, uploads it, and returns the URL.
   */
  async createVoucher(bookingId, guestData, pricingData, hotelName, voucherCode) {
    try {
      const bookingData = {
          booking_id: bookingId,
          guest_data: guestData,
          pricing: pricingData,
          hotel_name: hotelName,
          voucher_code: voucherCode
      };

      const blob = await aliunMcpService.generateVoucher(bookingData);
      const url = await aliunMcpService.uploadDocument('voucher', blob);
      
      console.log(`[documentService] Document created: ${url}`);
      return url;
    } catch (error) {
      ErrorHandler.captureError(error, { component: 'documentService', action: 'createVoucher' });
      throw new Error("Failed to create voucher. Please try again.");
    }
  },

  /**
   * Creates an invoice, uploads it, and returns the URL.
   */
  async createInvoice(bookingId, guestData, pricingData, hotelName) {
    try {
        const bookingData = {
            booking_id: bookingId,
            guest_data: guestData,
            pricing: pricingData,
            hotel_name: hotelName
        };
  
        const blob = await aliunMcpService.generateInvoice(bookingData);
        const url = await aliunMcpService.uploadDocument('invoice', blob);
        
        console.log(`[documentService] Document created: ${url}`);
        return url;
      } catch (error) {
        ErrorHandler.captureError(error, { component: 'documentService', action: 'createInvoice' });
        throw new Error("Failed to create invoice. Please try again.");
      }
  }
};
