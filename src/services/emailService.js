// ========================================
// EMAIL SERVICE MODERNE
// src/services/emailService.js
// ========================================
require('dotenv').config();
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuration optimisée pour Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Utiliser le service Gmail prédéfini
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // false pour port 587 (STARTTLS)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Pour éviter les problèmes SSL en dev
      },
    });

    // Vérifier la configuration au démarrage
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Configuration email invalide:', error);
      } else {
        console.log('✅ Service email prêt');
      }
    });
  }

  // Template de base pour tous les emails
  getBaseTemplate(content, title = '') {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
      <style>
        body {
          background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 100%);
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          margin: 0; padding: 0;
        }
        .container {
          max-width: 520px;
          margin: 40px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(80, 112, 255, 0.10);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(90deg, #6366f1 0%, #818cf8 100%);
          color: #fff;
          padding: 32px 24px 20px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 2rem;
          letter-spacing: 1px;
        }
        .header .subtitle {
          font-size: 1rem;
          opacity: 0.85;
        }
        .content {
          padding: 32px 24px 24px 24px;
        }
        .card {
          background: #f1f5ff;
          border-radius: 12px;
          padding: 20px 18px;
          margin: 24px 0;
          box-shadow: 0 2px 8px rgba(99,102,241,0.07);
        }
        .card h2 {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          color: #6366f1;
        }
        .card p, .card div {
          margin: 0 0 6px 0;
          color: #374151;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(90deg, #6366f1 0%, #818cf8 100%);
          color: #fff;
          padding: 12px 28px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 600;
          margin: 18px 0 0 0;
          box-shadow: 0 2px 8px rgba(99,102,241,0.10);
          transition: background 0.2s;
        }
        .btn:hover {
          background: linear-gradient(90deg, #818cf8 0%, #6366f1 100%);
        }
        .footer {
          background: #232946;
          color: #bfc9e0;
          text-align: center;
          padding: 24px 12px 18px 12px;
          font-size: 0.95rem;
        }
        .footer a {
          color: #a5b4fc;
          text-decoration: none;
          margin: 0 8px;
        }
        .footer .discord-btn {
          display: inline-block;
          background: #5865F2;
          color: #fff;
          border-radius: 8px;
          padding: 8px 18px;
          margin: 12px 0 0 0;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s;
        }
        .footer .discord-btn:hover {
          background: #4752c4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 Silent For Vibes</h1>
          <div class="subtitle">Votre équipe de champions</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <div>
            <a href="https://discord.gg/vE2aqfJT4H" class="discord-btn" target="_blank">Rejoindre le Discord</a> |
          </div>
          <div style="margin-top:10px; font-size:0.9em;">
            © 2025 Silent For Vibes – Tous droits réservés
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  }

  async sendVerificationEmail(email, token, pseudo) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const content = `
            <h1>🚀 Bienvenue ${pseudo} !</h1>
            
            <p>Félicitations ! Tu viens de rejoindre l'une des meilleures équipes esport. 🏆</p>
            
            <p>Avant de pouvoir accéder à tous les outils de l'équipe, nous devons vérifier ton adresse email. C'est une question de sécurité - tu comprends, on ne peut pas laisser n'importe qui accéder aux stratégies secrètes ! 😉</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">
                    ✨ Activer mon compte
                </a>
            </div>
            
            <div class="warning-box">
                <strong>⏰ Attention :</strong> Ce lien de vérification expire dans 24 heures. Ne tarde pas trop !
            </div>
            
            <p>Une fois ton compte activé, tu pourras :</p>
            <ul style="color: #4a5568; margin-left: 20px;">
                <li>🗓️ Consulter le planning des entraînements</li>
                <li>💬 Recevoir les invitations aux sessions</li>
                <li>📊 Accéder aux analyses de tes performances</li>
                <li>🎯 Suivre tes objectifs personnels</li>
            </ul>
            
            <p>Si tu n'es pas à l'origine de cette inscription, ignore simplement cet email. Ton adresse ne sera pas utilisée.</p>
            
            <p style="margin-top: 30px;"><strong>Prêt(e) à dominer ? Let's go ! 🔥</strong></p>
        `;

    const mailOptions = {
      from: `"🎮 SilentForVibes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🚀 Bienvenue ${pseudo} - Active ton compte maintenant !`,
      html: this.getBaseTemplate(content, 'Activation de compte'),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEventInvitation(
    email,
    pseudo,
    eventTitle,
    eventDate,
    eventType = 'Session'
  ) {
    const eventDateTime = new Date(eventDate);
    const formattedDate = eventDateTime.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Paris',
    });
    const formattedTime = eventDateTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });

    const eventEmoji = {
      entrainement: '🏋️‍♂️',
      coaching: '🎯',
      tournois: '🏆',
      practices: '⚔️',
      session_jeu: '🎮',
    };

    const content = `
            <h1>📬 Nouvelle invitation</h1>
            
            <p>Salut <strong>${pseudo}</strong> ! 👋</p>
            
            <p>Tu es convoqué(e) pour une nouvelle session. Prépare-toi, ça va être intense ! 🔥</p>
            
            <div class="info-box">
                <h2>${eventEmoji[eventType] || '🎮'} ${eventTitle}</h2>
                <p style="margin: 10px 0; font-size: 18px;">
                    📅 <strong>${formattedDate}</strong><br>
                    🕐 <strong>${formattedTime}</strong>
                </p>
            </div>
            
            <p>Cette session est importante pour l'évolution de l'équipe. Ta présence compte ! 💪</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/events" class="button">
                    ✅ Répondre à l'invitation
                </a>
            </div>
            
            <div class="warning-box">
                <strong>⚡ Action requise :</strong> Connecte-toi sur la plateforme pour confirmer ta présence. Les absences non justifiées sont mal vues par le coach ! 😤
            </div>
            
            <p>N'oublie pas de :</p>
            <ul style="color: #4a5568; margin-left: 20px;">
                <li>🎧 Préparer ton setup audio</li>
                <li>☕ Prévoir de quoi t'hydrater</li>
                <li>🧠 Réviser les stratégies récentes</li>
                <li>🔥 Arriver avec la motivation à bloc !</li>
            </ul>
            
            <p style="margin-top: 30px;"><strong>See you on the Rift ! 🚀</strong></p>
        `;

    const mailOptions = {
      from: `"🎮 Silent For Vibes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔔 ${eventTitle} - ${formattedDate}`,
      html: this.getBaseTemplate(content, 'Invitation événement'),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendTemporaryPassword(
    email,
    pseudo,
    temporaryPassword,
    createdBy = 'un capitaine',
    verificationToken = null
  ) {
    const content = `
            <h1>🎊 Bienvenue dans l'équipe ${pseudo} !</h1>
            
            <p>Excellente nouvelle ! ${createdBy} vient de t'ajouter à notre équipe esport. Tu fais maintenant partie de l'élite ! 🏆</p>
            
            <p>Ton compte a été créé avec des identifiants temporaires. Pour des raisons de sécurité, tu devras changer ton mot de passe dès ta première connexion.</p>
            
            <div class="credentials">
                <h2>🔐 Tes identifiants</h2>
                <p><strong>📧 Email :</strong> ${email}</p>
                <p><strong>🔑 Mot de passe temporaire :</strong> <code style="background: #e2e8f0; padding: 5px 10px; border-radius: 5px; font-family: monospace; font-size: 16px;">${temporaryPassword}</code></p>
            </div>
            
            <div class="warning-box">
                <strong>⚠️ Important :</strong> Ce mot de passe est temporaire et doit être changé lors de ta première connexion. Ne le partage avec personne !
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  verificationToken
                    ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
                    : `${process.env.FRONTEND_URL}/login`
                }" class="button">
                    ${
                      verificationToken
                        ? '✨ Activer mon compte'
                        : '🚀 Première connexion'
                    }
                </a>
            </div>
            
            <p>Une fois connecté(e), tu auras accès à :</p>
            <ul style="color: #4a5568; margin-left: 20px;">
                <li>📅 Le planning complet de l'équipe</li>
                <li>💬 Les communications internes</li>
                <li>📊 Tes statistiques personnelles</li>
                <li>🎯 Les objectifs et exercices du coach</li>
                <li>🏆 L'historique des victoires de l'équipe</li>
            </ul>
            
            <div class="info-box">
                <p style="margin: 0;"><strong>💡 Conseil de pro :</strong> Change ton mot de passe pour quelque chose de personnel mais sécurisé. Mix majuscules, minuscules, chiffres et caractères spéciaux !</p>
            </div>
            
            <p style="margin-top: 30px;">Prêt(e) à écrire l'histoire avec nous ? <strong>Let's make some magic happen ! ✨</strong></p>
        `;

    const mailOptions = {
      from: `"🎮 Silent For Vibes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 ${pseudo}, bienvenue dans l'équipe ! Ton compte t'attend`,
      html: this.getBaseTemplate(content, 'Compte créé'),
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Nouveau : Email de rappel d'événement
  async sendEventReminder(email, pseudo, eventTitle, eventDate, timeToEvent) {
    const content = `
            <h1>⏰ Rappel important !</h1>
            
            <p>Hey <strong>${pseudo}</strong> ! 👋</p>
            
            <p>Petit rappel amical : tu as un événement qui approche !</p>
            
            <div class="info-box">
                <h2>🎮 ${eventTitle}</h2>
                <p style="margin: 10px 0; font-size: 18px;">
                    🚨 <strong>Dans ${timeToEvent}</strong>
                </p>
            </div>
            
            <p>N'oublie pas de te préparer et d'arriver à l'heure. L'équipe compte sur toi ! 💪</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/events" class="button">
                    📋 Voir les détails
                </a>
            </div>
        `;

    const mailOptions = {
      from: `"🎮 Silent For Vibes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⏰ Rappel : ${eventTitle} bientôt !`,
      html: this.getBaseTemplate(content, 'Rappel événement'),
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Nouveau : Email de félicitations
  async sendCongratulations(email, pseudo, achievement) {
    const content = `
            <h1>🎉 Félicitations ${pseudo} !</h1>
            
            <p>WOW ! Tu viens de réaliser quelque chose d'exceptionnel ! 🔥</p>
            
            <div class="info-box">
                <h2>🏆 ${achievement}</h2>
                <p style="margin: 0;">Tu es une véritable légende !</p>
            </div>
            
            <p>Continue comme ça, tu fais la fierté de toute l'équipe ! 💪</p>
            
            <p style="text-align: center; font-size: 20px; margin: 30px 0;">
                🎊 GG WP ! 🎊
            </p>
        `;

    const mailOptions = {
      from: `"🎮 Silent For Vibes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🏆 Félicitations ${pseudo} ! Tu assures !`,
      html: this.getBaseTemplate(content, 'Félicitations'),
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Email de réponse à une demande de practice
  async sendPracticeResponse(email, status, response, teamName, requestedDate) {
    const subject =
      status === 'accepted'
        ? '✅ Votre demande de practice a été acceptée !'
        : '❌ Réponse à votre demande de practice';

    const statusText = status === 'accepted' ? 'acceptée' : 'refusée';
    const statusEmoji = status === 'accepted' ? '✅' : '❌';

    const content = `
      <h1>${statusEmoji} Réponse à votre demande de practice</h1>
      <p>Bonjour,</p>
      <p>Nous avons le plaisir de vous informer que votre demande de practice a été <strong>${statusText}</strong>.</p>
      
      <div class="info-box">
        <h2>📋 Détails de la demande</h2>
        <p><strong>Équipe :</strong> ${teamName}</p>
        <p><strong>Date demandée :</strong> ${new Date(
          requestedDate
        ).toLocaleDateString('fr-FR')}</p>
        <p><strong>Statut :</strong> ${statusText}</p>
      </div>
      
      ${
        response
          ? `
        <div class="warning-box">
          <h3>💬 Message de l'équipe</h3>
          <p>${response}</p>
        </div>
      `
          : ''
      }
      
      ${
        status === 'accepted'
          ? `
        <p>Nous vous contacterons bientôt pour organiser les détails de la session.</p>
        <p>Préparez-vous pour un entraînement intense ! 💪</p>
      `
          : `
        <p>Nous vous remercions de votre intérêt et espérons pouvoir collaborer à l'avenir.</p>
      `
      }
    `;

    const mailOptions = {
      from: `"🎮 Silent For Vibes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: this.getBaseTemplate(content, 'Réponse practice'),
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Nouveau : Email de notification de réponse d'événement pour le créateur
  async sendEventResponseNotification(
    creatorEmail,
    creatorPseudo,
    playerPseudo,
    eventTitle,
    status,
    eventDate,
    eventType = 'Événement'
  ) {
    const statusText = status === 'accepted' ? 'accepté' : 'refusé';
    const statusEmoji = status === 'accepted' ? '✅' : '❌';
    const statusColor = status === 'accepted' ? '#16a34a' : '#dc2626';

    const formattedDate = new Date(eventDate).toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });

    const content = `
            <h1>${statusEmoji} Réponse à votre invitation</h1>
            
            <p>Salut <strong>${creatorPseudo}</strong> ! 👋</p>
            
            <p>Vous avez reçu une réponse à votre invitation !</p>
            
            <div class="card">
                <h2>🎮 ${eventTitle}</h2>
                <p><strong>📅 Date :</strong> ${formattedDate}</p>
                <p><strong>🎯 Type :</strong> ${eventType}</p>
                <p><strong>👤 Joueur :</strong> ${playerPseudo}</p>
                <p style="color: ${statusColor}; font-weight: bold; font-size: 18px;">
                    ${statusEmoji} ${playerPseudo} a ${statusText} l'invitation
                </p>
            </div>
            
            ${
              status === 'accepted'
                ? `
                <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #16a34a; margin: 0; font-weight: bold;">🎉 Excellent ! Un joueur de plus pour votre événement !</p>
                </div>
            `
                : `
                <div style="background: #fee2e2; border: 1px solid #dc2626; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #dc2626; margin: 0; font-weight: bold;">😔 Dommage, ${playerPseudo} ne pourra pas participer.</p>
                </div>
            `
            }
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  process.env.FRONTEND_URL
                }/events/${eventTitle}" class="btn">
                    📋 Voir l'événement
                </a>
            </div>
            
            <p style="margin-top: 30px;">Vous pouvez consulter tous les détails et les autres réponses dans votre tableau de bord.</p>
        `;

    const mailOptions = {
      from: `"🎮 Silent For Vibes" <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `${statusEmoji} ${playerPseudo} a ${statusText} votre invitation - ${eventTitle}`,
      html: this.getBaseTemplate(content, 'Réponse invitation'),
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
