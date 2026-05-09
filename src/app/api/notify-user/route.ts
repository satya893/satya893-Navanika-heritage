import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type NotificationType = 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'low_stock' | 'abandoned_cart' | 'order_refunded';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, 
      phone, 
      orderId, 
      method, 
      type = 'order_confirmation',
      productName,
      stockCount,
      cartLink
    } = body as {
      email?: string;
      phone?: string;
      orderId?: string;
      method?: string;
      type?: NotificationType;
      productName?: string;
      stockCount?: number;
      cartLink?: string;
    };
    
    console.log(`[NOTIFICATION] Sending ${type} notification to:`, { email, phone });

    // 1. Email Logic (Nodemailer)
    let emailSent = false;
    if (email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      let subject = 'Navanika Heritage Update';
      let html = '';

      const header = `
        <div style="font-family: 'Georgia', serif; color: #0A1128; max-w-2xl mx-auto; padding: 40px; background: #FDFCF8; border: 1px solid #EBE4D1;">
          <h1 style="color: #C5A059; text-align: center; font-size: 32px; letter-spacing: 4px; margin-bottom: 5px;">NAVANIKA</h1>
          <p style="text-align: center; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 30px; color: #0A1128/60;">The Heritage Boutique</p>
          <hr style="border: 0; border-top: 1px solid #EBE4D1; margin: 30px 0;" />
      `;

      const footer = `
          <hr style="border: 0; border-top: 1px solid #EBE4D1; margin: 30px 0;" />
          <p style="text-align: center; font-size: 11px; color: #999; line-height: 2;">
            Navanika Heritage Boutique<br/>
            Unveiling Timeless Elegance<br/>
            © ${new Date().getFullYear()} All Rights Reserved
          </p>
        </div>
      `;

      switch (type) {
        case 'order_confirmation':
          subject = `Order Confirmed - Navanika Heritage #${orderId?.slice(0,8).toUpperCase()}`;
          html = `${header}
            <h2 style="font-size: 20px; font-weight: normal; color: #0A1128;">Your order is confirmed.</h2>
            <p>Thank you for choosing Navanika. We have received your order <strong>#${orderId}</strong> and are preparing it with care.</p>
            <div style="background: #F5F2EA; padding: 25px; margin: 30px 0;">
              <p style="margin: 0; font-size: 13px;"><strong>Method:</strong> ${method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}</p>
            </div>
            ${footer}`;
          break;
        case 'order_shipped':
          subject = `Out for Delivery - Your Heritage Piece is Coming!`;
          html = `${header}
            <h2 style="font-size: 20px; font-weight: normal; color: #0A1128;">It's on the way!</h2>
            <p>Great news! Your order <strong>#${orderId}</strong> has been handed over to our artisan logistics partner.</p>
            <p>You'll be draping excellence very soon.</p>
            ${footer}`;
          break;
        case 'low_stock':
          subject = `URGENT: Low Stock Alert - ${productName}`;
          html = `${header}
            <h2 style="color: #D64545;">Inventory Alert</h2>
            <p>The product <strong>${productName}</strong> is running low on stock.</p>
            <p>Current Quantity: <span style="font-size: 20px; font-weight: bold;">${stockCount}</span></p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" style="display: inline-block; background: #0A1128; color: white; padding: 12px 24px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Restock Now</a>
            ${footer}`;
          break;
        case 'abandoned_cart':
          subject = `A Piece of Heritage is Waiting...`;
          html = `${header}
            <h2 style="font-size: 20px; font-weight: normal; color: #0A1128;">Don't let it slip away.</h2>
            <p>We noticed you left something exquisite in your cart. Our handcrafted collections are often unique and sell out quickly.</p>
            <a href="${cartLink}" style="display: inline-block; background: #C5A059; color: white; padding: 15px 30px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 20px 0;">Return to Cart</a>
            ${footer}`;
          break;
        case 'order_delivered':
          subject = `Delivered: Your Heritage Has Arrived!`;
          html = `${header}
            <h2 style="font-size: 20px; font-weight: normal; color: #0A1128;">Delivered!</h2>
            <p>Your order <strong>#${orderId}</strong> has been successfully delivered.</p>
            <p>We hope this piece brings you as much joy as it brought us in creating it. We'd love to see you drape it!</p>
            ${footer}`;
          break;
        case 'order_refunded':
          const isExchange = productName?.toLowerCase().includes('exchange') || cartLink === 'exchange';
          subject = isExchange 
            ? `Exchange Approved - Order #${orderId?.slice(0,8).toUpperCase()}`
            : `Cancellation Accepted & Refund Processed - Order #${orderId?.slice(0,8).toUpperCase()}`;
          
          html = `${header}
            <h2 style="font-size: 20px; font-weight: normal; color: #0A1128;">${isExchange ? 'Exchange Request Approved' : 'Cancellation Accepted'}</h2>
            <p>We have reviewed and <strong>accepted</strong> your request for Order <strong>#${orderId}</strong>.</p>
            
            <div style="background: #F5F2EA; padding: 25px; margin: 30px 0; border-left: 4px solid #C5A059;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; tracking-widest: 1px;">Order Amount</p>
              <p style="margin: 5px 0 0; font-size: 24px; color: #C5A059; font-weight: bold;">₹{(productName || '0').replace('exchange', '').trim()}</p>
              
              <p style="margin: 15px 0 0; font-size: 13px; color: #0A1128;">
                ${isExchange 
                  ? "Our concierge will contact you within 24 hours to coordinate your <strong>Exchange Piece</strong> selection."
                  : "Your refund will be processed and credited to your original payment method within <strong>24 hours</strong>."
                }
              </p>
            </div>

            <p>${isExchange ? "We're excited to help you find the perfect heritage piece." : "We're sorry this piece didn't work out. We hope to see you again soon."}</p>
            ${footer}`;
          break;
      }

      await transporter.sendMail({
        from: `"Navanika Heritage" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      console.log(`[EMAIL] Successfully sent ${type} email to ${email}`);
      emailSent = true;
    }

    // 2. SMS Logic (Twilio) - COMMENTED OUT UNTIL ACTIVATED
    let smsSent = false;
    /*
    if (phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      let message = '';

      switch (type) {
        case 'order_confirmation':
          message = `Navanika: Order confirmed! #${orderId?.slice(0,8).toUpperCase()}. Thank you for choosing heritage.`;
          break;
        case 'order_shipped':
          message = `Navanika: Your order #${orderId?.slice(0,8).toUpperCase()} has been shipped and is on its way!`;
          break;
      }

      if (message) {
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone.startsWith('+') ? phone : `+91${phone}` // Default to India if no prefix
        });
        smsSent = true;
      }
    }
    */

    return NextResponse.json({ 
      success: true, 
      emailSent, 
      smsSent,
      message: "Notifications processed" 
    });
  } catch (err: any) {
    console.error("Notification System Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
