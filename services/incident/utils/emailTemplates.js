const emailTemplates = {
  incidentCreated: (incidentTitle, createdBy, incidentId) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Incident Created</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 New Incident Created</h1>
        </div>
        <div class="content">
          <h2>Incident Details</h2>
          <p><strong>Title:</strong> ${incidentTitle}</p>
          <p><strong>Created By:</strong> ${createdBy}</p>
          <p><strong>Incident ID:</strong> ${incidentId}</p>
          <p>Please review and take appropriate action.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from IncidentFlow.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  incidentUpdated: (incidentTitle, updatedBy, incidentId, changes) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Incident Updated</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Incident Updated</h1>
        </div>
        <div class="content">
          <h2>Incident Details</h2>
          <p><strong>Title:</strong> ${incidentTitle}</p>
          <p><strong>Updated By:</strong> ${updatedBy}</p>
          <p><strong>Incident ID:</strong> ${incidentId}</p>
          <p><strong>Changes:</strong> ${changes}</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from IncidentFlow.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  incidentResolved: (incidentTitle, resolvedBy, incidentId) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Incident Resolved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Incident Resolved</h1>
        </div>
        <div class="content">
          <h2>Incident Details</h2>
          <p><strong>Title:</strong> ${incidentTitle}</p>
          <p><strong>Resolved By:</strong> ${resolvedBy}</p>
          <p><strong>Incident ID:</strong> ${incidentId}</p>
          <p>This incident has been successfully resolved.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from IncidentFlow.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

module.exports = emailTemplates; 