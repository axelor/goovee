import {APP_TITLE} from '@/constants';

export const inviteTemplate = ({
  email,
  link,
  subject,
}: {
  email: string;
  link: string;
  subject?: string;
}) => ({
  subject: [`You're Invited to Join ${APP_TITLE}!`, subject].join(' | '),
  to: email,
  html: inviteTemplateHTML({link}),
});

export const inviteTemplateHTML = ({link}: {link: string}) => `
<!DOCTYPE html>
<html>
<head>
    <title>You're Invited to Join ${APP_TITLE}!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            background-color: #f9f9f9;
            margin: 0;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            margin: 20px 0;
            padding: 12px 20px;
            background-color: #58d59d;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }
        .footer {
            font-size: 14px;
            color: #666666;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited to Join ${APP_TITLE}!</h1>
        </div>
        <p>We’re thrilled to invite you to join <strong>${APP_TITLE}</strong>!</p>
        <p>Click the button below to register and become a part of our growing community:</p>
        <div>
            <a href="${link}" class="button">Register on ${APP_TITLE} Now</a>
        </div>
        <p>It’s quick, easy, and completely free to sign up.</p>
        <p>We look forward to welcoming you!</p>
        <div class="footer">
            <p>Best regards,<br>The ${APP_TITLE} Team</p>
        </div>
    </div>
</body>
</html>
`;
