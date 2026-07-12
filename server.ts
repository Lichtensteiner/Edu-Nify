import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

// Create nodemailer transporter from environment variables
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER || "ludo.consulting3@gmail.com";
  const pass = process.env.SMTP_PASS || "thug tjur etqz igut";

  // SSL for 465, 564, etc.
  const isSecure = port === 465 || port === 564 || port === 993 || port === 995;

  console.log(`[SMTP] Initializing transporter for ${host}:${port} (secure: ${isSecure}) as ${user}`);

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Generate the beautiful HTML structure for welcoming a new user
function generateWelcomeEmailHtml(params: {
  prenom: string;
  nom: string;
  role: string;
  email: string;
  password?: string;
  establishmentName?: string;
}) {
  const { prenom, nom, role, email, password, establishmentName } = params;
  const fullName = `${prenom} ${nom}`.trim() || "Utilisateur";
  const schoolName = establishmentName || "Edu-Nify Écosystème Scolaire";
  
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Edu-Nify</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #334155;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #0f172a;
          padding: 32px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #94a3b8;
        }
        .content {
          padding: 40px 32px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .lead {
          font-size: 16px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 24px;
        }
        .credentials-card {
          background-color: #f1f5f9;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
        }
        .credentials-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .credential-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .credential-row:last-child {
          border-bottom: none;
        }
        .credential-label {
          font-weight: 500;
          color: #64748b;
          font-size: 14px;
        }
        .credential-value {
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
          word-break: break-all;
        }
        .btn-container {
          text-align: center;
          margin-top: 32px;
        }
        .btn {
          display: inline-block;
          background-color: #4f46e5;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
          transition: background-color 0.2s ease;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px 32px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Edu-Nify</h1>
          <p>Écosystème Éducatif Connecté</p>
        </div>
        <div class="content">
          <h2 class="greeting">Bonjour ${fullName},</h2>
          <p class="lead">Votre compte a été créé avec succès par l'administration de l'établissement <strong>${schoolName}</strong>.</p>
          
          <div class="credentials-card">
            <h3 class="credentials-title">Vos informations d'accès</h3>
            <div class="credential-row">
              <span class="credential-label">E-mail de connexion</span>
              <span class="credential-value">${email}</span>
            </div>
            <div class="credential-row">
              <span class="credential-label">Rôle d'accès</span>
              <span class="credential-value">${formattedRole}</span>
            </div>
            ${password ? `
            <div class="credential-row">
              <span class="credential-label">Mot de passe temporaire</span>
              <span class="credential-value" style="font-family: monospace; color: #4f46e5; font-size: 15px; letter-spacing: 0.5px;">${password}</span>
            </div>
            ` : ''}
          </div>

          <p class="lead" style="margin-bottom: 8px;">Lors de votre première connexion, il vous sera demandé de modifier votre mot de passe temporaire pour assurer la sécurité de vos données personnelles.</p>
          
          <div class="btn-container">
            <a href="${process.env.APP_URL || 'https://edu-nify.ga'}" class="btn">Accéder à mon espace</a>
          </div>
        </div>
        <div class="footer">
          <p>Cet e-mail automatique vous est envoyé par le serveur SMTP d'Edu-Nify.</p>
          <p>© ${new Date().getFullYear()} Edu-Nify. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client on the server
  // User-Agent: aistudio-build is mandatory for telemetry!
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for chat agent
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    try {
      const { message, userName, agentRole } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Format agent context and system instruction
      let systemInstruction = `You are a helpful assistant.`;
      if (agentRole === "orientation") {
        systemInstruction = `Tu es l'Agent d'Orientation Académique, un assistant d'orientation intelligent, bienveillant et expert en éducation. Tu t'adresses à l'utilisateur qui s'appelle ${userName || "Martinien"}. Aide-le à choisir ses universités, ses matières, et à planifier son parcours scolaire ou professionnel de manière structurée et moderne. Réponds toujours en français, de manière polie et concise.`;
      } else if (agentRole === "juridique") {
        systemInstruction = `Tu es l'Agent Juridique, un conseiller juridique virtuel spécialisé dans l'analyse de dossiers administratifs et de contrats. Tu t'adresses à l'utilisateur qui s'appelle ${userName || "Martinien"}. Aide-le à comprendre ses obligations légales, à vérifier la conformité de ses dossiers, et à préparer des réclamations ou des contrats. Réponds toujours en français, de manière claire, rigoureuse et concise. Précise que tu n'es pas un avocat mais un assistant intelligent.`;
      } else if (agentRole === "administratif") {
        systemInstruction = `Tu es l'Agent Administratif, un secrétaire et rédacteur administratif d'élite. Tu t'adresses à l'utilisateur qui s'appelle ${userName || "Martinien"}. Aide-le à rédiger des lettres officielles, à remplir des formulaires, à structurer ses dossiers d'inscription et ses rapports d'activité. Réponds toujours en français, dans un style professionnel, poli et bien structuré.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ error: error.message || "An error occurred with Gemini API" });
    }
  });

  // API route for general/bulletin Gemini Proxy
  app.post("/api/gemini/generate", async (req: express.Request, res: express.Response) => {
    try {
      const { request } = req.body;
      if (!request || !request.contents) {
        return res.status(400).json({ error: "request and contents are required" });
      }

      let modelName = request.model || "gemini-3.5-flash";
      if (modelName === "gemini-1.5-flash" || modelName === "gemini-1.5-pro" || modelName === "gemini-pro" || modelName === "gemini-3-flash-preview") {
        modelName = "gemini-3.5-flash";
      }

      const result = await ai.models.generateContent({
        model: modelName,
        contents: request.contents,
        config: request.config
      });

      return res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      return res.status(500).json({ error: error.message || "An error occurred with Gemini API Proxy" });
    }
  });

  // API route for real-time email verification
  app.post("/api/auth/verify-email", (req: express.Request, res: express.Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required", valid: false });
      }

      // Basic regex check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(200).json({ valid: false, error: "Format de l'e-mail invalide" });
      }

      return res.json({ valid: true });
    } catch (error: any) {
      console.error("Verify Email Error:", error);
      return res.status(500).json({ valid: false, error: error.message });
    }
  });

  // API route to dispatch user created credentials notification email
  app.post("/api/notifications/user-created", async (req: express.Request, res: express.Response) => {
    try {
      const { email, prenom, nom, role, password, establishmentName } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Target email address is required" });
      }

      const fromAddress = process.env.SMTP_FROM || "ludo.consulting3@gmail.com";
      const transporter = getTransporter();

      const htmlContent = generateWelcomeEmailHtml({
        prenom: prenom || "",
        nom: nom || "",
        role: role || "utilisateur",
        email,
        password,
        establishmentName
      });

      const textContent = `Bonjour ${prenom || ""} ${nom || ""},\n\nVotre compte a été créé avec succès par l'administration de l'établissement ${establishmentName || "Edu-Nify"}.\n\nVos informations d'accès :\n- E-mail : ${email}\n- Rôle : ${role}\n${password ? `- Mot de passe temporaire : ${password}\n` : ""}\n\nAccédez à votre espace sur : ${process.env.APP_URL || "https://edu-nify.ga"}\n\nCordialement,\nL'équipe Edu-Nify.`;

      const mailOptions = {
        from: `"Edu-Nify" <${fromAddress}>`,
        to: email,
        subject: `[Edu-Nify] Bienvenue ! Vos accès de connexion`,
        text: textContent,
        html: htmlContent
      };

      console.log(`[SMTP] Sending welcome email to ${email}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Email successfully sent to ${email}. Message ID: ${info.messageId}`);

      return res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("[SMTP Error] Failed to send email notification:", error);
      return res.status(500).json({ error: error.message || "An error occurred while sending the email" });
    }
  });

  // API route to test SMTP credentials live
  app.post("/api/notifications/test-smtp", async (req: express.Request, res: express.Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Target test email is required" });
      }

      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = process.env.SMTP_PORT || "465";
      const user = process.env.SMTP_USER || "ludo.consulting3@gmail.com";
      const fromAddress = process.env.SMTP_FROM || "ludo.consulting3@gmail.com";

      const transporter = getTransporter();

      // Verify connection configuration
      console.log("[SMTP Test] Verifying transporter connection...");
      await transporter.verify();
      console.log("[SMTP Test] Connection verified successfully.");

      const mailOptions = {
        from: `"Edu-Nify Test SMTP" <${fromAddress}>`,
        to: email,
        subject: `⚡ [TEST SMTP SUCCESS] Edu-Nify Connection Validated`,
        text: `Félicitations !\n\nVotre configuration de messagerie SMTP fonctionne parfaitement sur Edu-Nify.\n\nDétails de la connexion :\n- Hôte SMTP : ${host}\n- Port : ${port}\n- Compte utilisateur : ${user}\n- Expéditeur : ${fromAddress}\n\nTemps réel : Activé !\n\nDate du test : ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n\nCordialement,\nL'équipe Technique Edu-Nify`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 20px;">⚡ Test SMTP Réussi !</h2>
              <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Votre serveur SMTP est configuré et prêt pour le temps réel.</p>
            </div>
            <div style="padding: 30px; background-color: #ffffff; color: #334155;">
              <p style="margin-top: 0; font-size: 15px; line-height: 1.5;">Félicitations, la connexion avec le serveur SMTP a été établie avec succès et ce message confirme le bon fonctionnement de l'envoi d'e-mails en temps réel.</p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 18px; margin: 24px 0; border: 1px solid #f1f5f9;">
                <h4 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Données d'Infrastructure</h4>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Hôte SMTP :</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #0f172a; font-family: monospace;">${host}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Port SMTP :</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #0f172a; font-family: monospace;">${port}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Identifiant :</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #0f172a; font-family: monospace;">${user}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; font-weight: 500;">Adresse Expéditeur :</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #0f172a; font-family: monospace;">${fromAddress}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">Ce test a été initié en direct depuis la page Paramètres d'Edu-Nify.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              © ${new Date().getFullYear()} Edu-Nify. Tous droits de messagerie activés.
            </div>
          </div>
        `
      };

      console.log(`[SMTP Test] Dispatching test email to ${email}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Test] Dispatch success: ${info.messageId}`);

      return res.json({
        success: true,
        message: `E-mail de test envoyé avec succès à ${email}`,
        details: {
          host,
          port,
          user,
          messageId: info.messageId
        }
      });
    } catch (error: any) {
      console.error("[SMTP Test Error] Validation failed:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Impossible de se connecter au serveur SMTP ou d'envoyer l'e-mail."
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
