import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, service, message } = body;

    // Vérifier si les variables d'environnement sont configurées
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Les identifiants email ne sont pas configurés. L'email ne sera pas envoyé.");
      return NextResponse.json({ success: false, message: "Configuration email manquante" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ['amaeldorian06@gmail.com', 'aminouabdoulnassir9@gmail.com'].join(', '),
      subject: `Nouveau devis Nexus Digital : ${service} - ${name}`,
      text: `
        Nouvelle demande de projet reçue depuis le site web :
        
        Nom: ${name}
        Email: ${email}
        Service: ${service}
        Message: ${message}
      `,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6C63FF;">Nouvelle demande de projet</h2>
          <p>Vous avez reçu une nouvelle demande de devis depuis le site web Nexus Digital.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Service souhaité :</strong> ${service}</p>
          <p><strong>Détails du projet :</strong></p>
          <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message || 'Aucun détail fourni.'}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 });
  }
}
