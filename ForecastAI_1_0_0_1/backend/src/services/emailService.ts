import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const FROM_EMAIL = process.env.FROM_EMAIL || "RamaSaiAvinash.Kanigolla@cognizant.com";
const PL_EMAIL = process.env.PL_EMAIL || "RamaSaiAvinash.Kanigolla@cognizant.com";
const PH_EMAIL = process.env.PH_EMAIL || "RamaSaiAvinash.Kanigolla@cognizant.com";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

export async function sendPLApprovalEmail(batch: any) {
  const msg = {
    to: PL_EMAIL,
    from: FROM_EMAIL,
    subject: `[ForecastAI] Batch Submitted for PL Approval - ${batch.batchName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ForecastAI</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0;">Revenue Forecast Application</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b;">Batch Submitted for Your Approval</h2>
          <p style="color: #475569;">A new forecast batch requires your review as <strong>Practice Lead</strong>.</p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Batch Name:</strong> ${batch.batchName}</p>
            <p><strong>Import Date:</strong> ${new Date(batch.importDate || batch.createdAt).toLocaleDateString()}</p>
            <p><strong>Current Total:</strong> <span style="color: #16a34a; font-size: 18px; font-weight: bold;">$${(Number(batch.currentTotal) / 1000000).toFixed(1)}M</span></p>
            <p><strong>Status:</strong> <span style="background: #fef3c7; color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 12px;">Under Review</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/approval/pl" style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Review & Approve
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from ForecastAI. Please do not reply.</p>
        </div>
      </div>
    `,
  };
  await sgMail.send(msg);
}

export async function sendPHApprovalEmail(batch: any) {
  const msg = {
    to: PH_EMAIL,
    from: FROM_EMAIL,
    subject: `[ForecastAI] PL Approved - Final Approval Required - ${batch.batchName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ForecastAI</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0;">Revenue Forecast Application</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b;">Final Approval Required</h2>
          <p style="color: #475569;">A forecast batch approved by PL requires your <strong>final approval as Practice Head</strong>.</p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Batch Name:</strong> ${batch.batchName}</p>
            <p><strong>Import Date:</strong> ${new Date(batch.importDate || batch.createdAt).toLocaleDateString()}</p>
            <p><strong>Current Total:</strong> <span style="color: #16a34a; font-size: 18px; font-weight: bold;">$${(Number(batch.currentTotal) / 1000000).toFixed(1)}M</span></p>
            <p><strong>PL Status:</strong> <span style="background: #dbeafe; color: #2563eb; padding: 4px 10px; border-radius: 20px; font-size: 12px;">Approved by PL</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/approval/ph" style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Review & Lock Batch
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from ForecastAI. Please do not reply.</p>
        </div>
      </div>
    `,
  };
  await sgMail.send(msg);
}

export async function sendCommentEmailToPM(project: any, comment: string, commenterName: string) {
  const pmEmail = project.pmEmail || PL_EMAIL;
  const msg = {
    to: pmEmail,
    from: FROM_EMAIL,
    subject: `[ForecastAI] Revenue Comment on Your Project - ${project.projectDescription}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ForecastAI</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0;">Revenue Forecast Application</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b;">New Comment on Your Project</h2>
          <p style="color: #475569;">A comment has been added regarding revenue/forecast for your project.</p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Project:</strong> ${project.projectDescription}</p>
            <p><strong>Project ID:</strong> <span style="font-family: monospace;">${project.projectId}</span></p>
            <p><strong>Customer:</strong> ${project.customerDescription}</p>
            <p><strong>Commented By:</strong> ${commenterName}</p>
          </div>
          <div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #713f12; margin: 0;"><strong>Comment:</strong></p>
            <p style="color: #1e293b; margin: 8px 0 0 0;">${comment}</p>
          </div>
          <p style="color: #475569;">Please review and clarify the issue at the earliest.</p>
          <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from ForecastAI. Please do not reply.</p>
        </div>
      </div>
    `,
  };
  await sgMail.send(msg);
}
