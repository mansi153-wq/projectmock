const nodemailer = require('nodemailer');

// Lazy transporter — created only when needed
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const subject =
    purpose === 'registration'
      ? 'Verify Your Email — AI Mock Test Platform'
      : 'Password Reset OTP — AI Mock Test Platform';

  const heading =
    purpose === 'registration'
      ? 'Email Verification'
      : 'Password Reset';

  const subtext =
    purpose === 'registration'
      ? 'Use the code below to verify your email address and complete your registration.'
      : 'Use the code below to reset your password. If you did not request this, please ignore this email.';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb,#7c3aed);padding:32px 36px;text-align:center;">
              <div style="font-size:2rem;margin-bottom:8px;">🎯</div>
              <div style="font-size:1.2rem;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">AI Mock Test Platform</div>
              <div style="font-size:0.8rem;color:rgba(255,255,255,0.75);margin-top:4px;">${heading}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <p style="font-size:0.95rem;color:#374151;line-height:1.6;margin:0 0 24px;">${subtext}</p>
              
              <!-- OTP Box -->
              <div style="background:#f8faff;border:2px dashed #bfdbfe;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
                <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:10px;">Your Verification Code</div>
                <div style="font-size:2.8rem;font-weight:900;letter-spacing:12px;color:#2563eb;font-family:'Courier New',monospace;">${otp}</div>
                <div style="font-size:0.78rem;color:#9ca3af;margin-top:10px;">⏱ This code expires in <strong>5 minutes</strong></div>
              </div>

              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;font-size:0.82rem;color:#92400e;">
                <strong>Security Notice:</strong> Never share this code with anyone. The AI Mock Test Platform team will never ask for your OTP.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e8edf5;text-align:center;">
              <p style="font-size:0.75rem;color:#9ca3af;margin:0;">
                If you did not request this, please ignore this email.<br/>
                © 2026 AI Mock Test Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `AI Mock Test Platform <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendOtpEmail };
