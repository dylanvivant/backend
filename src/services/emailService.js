// ========================================
// EMAIL SERVICE MODERNE
// src/services/emailService.js
// ========================================
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Template de base pour tous les emails
  getBaseTemplate(content, title = '') {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    line-height: 1.6;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    position: relative;
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                    animation: shine 3s infinite;
                }
                
                @keyframes shine {
                    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }
                
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                
                .logo::before {
                    content: '🎮';
                    margin-right: 10px;
                }
                
                .tagline {
                    font-size: 14px;
                    opacity: 0.9;
                    font-weight: 300;
                }
                
                .content {
                    padding: 40px 30px;
                    background: #ffffff;
                }
                
                .content h1 {
                    color: #2d3748;
                    font-size: 24px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .content h2 {
                    color: #4a5568;
                    font-size: 20px;
                    margin-bottom: 15px;
                }
                
                .content p {
                    color: #4a5568;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                
                .button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 50px;
                    font-weight: bold;
                    text-align: center;
                    margin: 20px 0;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                    font-size: 16px;
                }
                
                .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }
                
                .info-box {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
                    margin: 20px 0;
                    text-align: center;
                }
                
                .warning-box {
                    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                    color: #8b4513;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border-left: 4px solid #ff6b6b;
                }
                
                .credentials {
                    background: #f7fafc;
                    border: 2px dashed #cbd5e0;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }
                
                .credentials strong {
                    color: #2d3748;
                    font-size: 18px;
                }
                
                .footer {
                    background: #2d3748;
                    color: #a0aec0;
                    padding: 30px;
                    text-align: center;
                    font-size: 14px;
                }
                
                .footer a {
                    color: #667eea;
                    text-decoration: none;
                }
                
                .social-links {
                    margin: 20px 0;
                }
                
                .social-links a {
                    display: inline-block;
                    margin: 0 10px;
                    color: #667eea;
                    font-size: 18px;
                    text-decoration: none;
                }
                
                @media (max-width: 600px) {
                    .email-container {
                        margin: 10px;
                        border-radius: 15px;
                    }
                    
                    .header, .content {
                        padding: 20px;
                    }
                    
                    .logo {
                        font-size: 24px;
                    }
                    
                    .button {
                        display: block;
                        margin: 20px auto;
                        width: fit-content;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo">ESPORT TEAM</div>
                    <div class="tagline">Votre équipe de champions</div>
                </div>
                
                <div class="content">
                    ${content}
                </div>
                
                <div class="footer">
                    <div class="social-links">
                        <a href="#" title="Discord">🎮</a>
                        <a href="#" title="Twitter">🐦</a>
                        <a href="#" title="Twitch">📺</a>
                    </div>
                    <p>© 2025 Esport Team - Tous droits réservés</p>
                    <p>Vous recevez cet email car vous faites partie de notre équipe.</p>
                    <p><a href="#">Se désabonner</a> | <a href="#">Préférences</a></p>
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
    });
    const formattedTime = eventDateTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
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
      from: `"🎮 Esport Team" <${process.env.EMAIL_USER}>`,
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
    createdBy = 'un capitaine'
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
                <a href="${process.env.FRONTEND_URL}/login" class="button">
                    🚀 Première connexion
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
      from: `"🎮 Esport Team" <${process.env.EMAIL_USER}>`,
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
      from: `"🎮 Esport Team" <${process.env.EMAIL_USER}>`,
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
      from: `"🎮 Esport Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🏆 Félicitations ${pseudo} ! Tu assures !`,
      html: this.getBaseTemplate(content, 'Félicitations'),
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
