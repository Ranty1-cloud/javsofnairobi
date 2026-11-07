// Customers pay to this Buy Goods and Services Till, then enter their M-Pesa code. Staff confirm it in Admin > Payments.
export const TILL = process.env.NEXT_PUBLIC_MPESA_TILL || "4308216";
// STK push (the automatic M-Pesa prompt) stays "coming soon" until this is set to "true" and the Daraja keys are added.
export const STK_ENABLED = process.env.NEXT_PUBLIC_STK_ENABLED === "true";
