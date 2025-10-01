import { ICreateAccount, IResetPassword } from "../types/emailTamplate";

export class HTMLTemplate {
  constructor() {}

  /**
   * Generate email data for account creation
   * @param values - name, email, otp
   */
  public createAccount(values: ICreateAccount) {
    return {
      to: values.email,
      subject: "Verify your account",
      html: `
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #555;">
  <table role="presentation" style="width: 100%; height: 100%; padding: 20px; background-color: #f9f9f9;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 30px; box-sizing: border-box;">
          <tr>
            <td style="text-align: center;">
              <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px; font-weight: normal;">
                Hello, ${values.name}!
              </h2>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Thank you for registering with us. To complete your account setup, please verify your email by entering the OTP below:
              </p>

              <!-- Optimized OTP Box -->
              <div style="
                display: inline-block;
                background-color: #277E16;
                padding: 15px 25px;
                border-radius: 12px;
                color: #fff;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 4px;
                margin: 20px 0;
                min-width: 120px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              ">
                ${values.otp}
              </div>

              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                This OTP is valid for 3 minutes. Please use it to confirm your email address and activate your account.
              </p>
              <p style="font-size: 16px; line-height: 1.5;">
                If you did not create an account with us, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Responsive Styles -->
  <style>
    @media only screen and (max-width: 480px) {
      h2 {
        font-size: 20px !important;
      }
      p {
        font-size: 14px !important;
      }
      div[style*="letter-spacing: 4px"] {
        padding: 10px 20px !important;
        font-size: 22px !important;
        min-width: 90px !important;
        letter-spacing: 3px !important;
      }
      table[role="presentation"] {
        padding: 20px !important;
      }
    }
  </style>
</body>
      `,
    };
  }

  /**
   * Generate email data for resetting password
   * @param values - email, otp
   */
  public resetPassword(values: IResetPassword) {
    return {
      to: values.email,
      subject: "Reset your password",
      html: `
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px; color: #333;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 25px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h2 style="text-align: center; color: #222;">Reset Password</h2>
              <p style="font-size: 15px; text-align: center;">Use the code below to reset your password:</p>
              <div style="background-color: #277E16; width: 100px; margin: 20px auto; padding: 12px 0; border-radius: 6px; color: #fff; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px;">
                  ${values.otp}
              </div>
              <p style="font-size: 14px; text-align: center; color: #555;">This code is valid for <strong>5 minutes</strong>.</p>
              <p style="font-size: 13px; color: #999; margin-top: 25px; line-height: 1.6;">
                  If you didn’t request this code, you can safely ignore this email. Someone may have entered your email by mistake.
              </p>
          </div>
        </body>
      `,
    };
  }

  /**
   * Return HTML page for server home
   */
  public serverHome(): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <title>System is on</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@500&display=swap');
            * { margin:0; padding:0; box-sizing:border-box; }
            body {
              height:100vh;
              overflow:hidden;
              font-family:'Orbitron',sans-serif;
              display:flex; align-items:center; justify-content:center;
              background: linear-gradient(135deg, #0b0f20, #05070c);
              position:relative;
            }
            .particles {
              position:absolute; width:100%; height:100%; background:#05070c;
              background: radial-gradient(circle at center, #001022 0%, #000 80%);
              z-index:0; overflow:hidden;
            }
            .particle {
              position:absolute; background:#00f6ff;
              opacity:0.6; border-radius:50%;
              animation: drift 6s ease-in-out infinite;
            }
            @keyframes drift {
              0% { transform: translate(0,0) scale(0.5); }
              50% { transform: translate(var(--dx), var(--dy)) scale(1); }
              100% { transform: translate(0,0) scale(0.5); }
            }
            .main {
              position:relative; z-index:2;
              background: rgba(0,0,0,0.5);
              padding:3rem 4rem;
              border:2px solid #00f6ff; border-radius:20px;
              box-shadow:
                0 0 20px #00f6ff,
                0 0 40px #ff00ff,
                0 0 80px #00f6ff;
              animation: pulseBox 5s ease-in-out infinite;
              text-align:center;
            }
            @keyframes pulseBox {
              0%,100% { transform:scale(1); box-shadow:0 0 20px #00f6ff,0 0 40px #ff00ff; }
              50% { transform:scale(1.05); box-shadow:0 0 60px #00f6ff,0 0 80px #ff00ff; }
            }
            .icon {
              font-size:6rem; color:#00f6ff;
              text-shadow:0 0 30px #00f6ff,0 0 60px #ff00ff;
              animation: rotateGlow 7s linear infinite;
            }
            @keyframes rotateGlow { 0%{transform:rotate(0deg);}100%{transform:rotate(360deg);} }
            h1 {
              margin:1rem 0; font-size:3rem; color:#fff;
              text-shadow:0 0 20px #00f6ff,0 0 40px #ff00ff;
              animation: flicker 4s infinite;
            }
            @keyframes flicker {
              0%,100% { opacity:1; }
              40%,60% { opacity:0.7; }
            }
            p {
              color:#ccc; font-family:'Rajdhani',sans-serif;
              font-size:1.3rem;
            }
          </style>
        </head>
        <body>
          <div class="particles" id="particles"></div>
          <div class="main">
            <div class="icon">🚀</div>
            <h1>Server Is Online</h1>
            <p>System fully operational. All channels green, ready for hyperspace requests!</p>
          </div>
          <script>
            const container = document.getElementById('particles');
            for(let i=0;i<15;i++){
              const p=document.createElement('div');
              p.classList.add('particle');
              const size=Math.random()*8+4;
              p.style.width=\`\${size}px\`;
              p.style.height=\`\${size}px\`;
              p.style.top=\`\${Math.random()*100}%\`;
              p.style.left=\`\${Math.random()*100}%\`;
              p.style.setProperty('--dx', (Math.random()*200-100)+'px');
              p.style.setProperty('--dy', (Math.random()*200-100)+'px');
              p.style.animationDelay=\`\${Math.random()*3}s\`;
              container.appendChild(p);
            }
          </script>
        </body>
        </html>`;
  }

  /**
   * Payment success
   */
  public paymentSuccess(): string {
    return `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      font-family: Arial, sans-serif;
      background: #e0ffe0;
    }
    .message-box {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2ecc71;
    }
    p {
      font-size: 18px;
    }
    .btn {
      margin-top: 1rem;
      display: inline-block;
      padding: 10px 20px;
      background: #2ecc71;
      color: #fff;
      border: none;
      border-radius: 4px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="message-box">
    <h1>Payment Successful!</h1>
    <p>Your transaction has been completed successfully.</p>
    <a class="btn" href="/">Go Home</a>
  </div>
</body>
</html>`
  }

  /**
   * Payment error
   */
  public paymentError(): string {
    return `<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancelled</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      font-family: Arial, sans-serif;
      background: #ffe0e0;
    }
    .message-box {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #e74c3c;
    }
    p {
      font-size: 18px;
    }
    .btn {
      margin-top: 1rem;
      display: inline-block;
      padding: 10px 20px;
      background: #e74c3c;
      color: #fff;
      border: none;
      border-radius: 4px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="message-box">
    <h1>Card adding Cancelled</h1>
    <p>Your process was not completed. Please try again later.</p>
    <a class="btn" href="/">Try Again</a>
  </div>
</body>
</html>`
  }

  /** 
   * Reconnect url
   */
  public reconnectUrl ( url: any ): string {
    return `<!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Revalidate Your Account</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f7fc;
                }

                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .header h1 {
                    color: #333;
                    font-size: 24px;
                }

                .content {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #555;
                    margin-bottom: 20px;
                }

                .button-container {
                    text-align: center;
                    margin-top: 20px;
                }

                .revalidate-btn {
                    background-color: #4CAF50;
                    color: #fff;
                    font-size: 18px;
                    padding: 15px 30px;
                    border-radius: 5px;
                    text-decoration: none;
                    display: inline-block;
                    width: 100%;
                    max-width: 300px;
                }

                .revalidate-btn:hover {
                    background-color: #45a049;
                }

                @media (max-width: 600px) {
                    .container {
                        margin: 20px;
                        padding: 15px;
                    }

                    .revalidate-btn {
                        font-size: 16px;
                        padding: 12px 20px;
                    }
                }
            </style>
        </head>

        <body>
            <div class="container">
                <div class="header">
                    <h1>Revalidate Your Account</h1>
                </div>
                <div class="content">
                    <p>It looks like you need to reconnect your account. To continue, please click the button below to revalidate your account and complete the setup process.</p>
                    <p>If you experience any issues or need further assistance, feel free to reach out to our support team.</p>
                </div>
                <div class="button-container">
                    <a href="${url}" class="revalidate-btn" target="_blank">Revalidate Your Account</a>
                </div>
            </div>
        </body>

    </html>
`
  }

  /**
   * 
   */
  public accountbindSuccessfull(): string {
    return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Account Binding Successful</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7fc;
        }

        .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #28a745;
            font-size: 24px;
        }

        .content {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 20px;
        }

        .button-container {
            text-align: center;
            margin-top: 20px;
        }

        .next-step-btn {
            background-color: #007bff;
            color: #fff;
            font-size: 18px;
            padding: 15px 30px;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
            width: 100%;
            max-width: 300px;
        }

        .next-step-btn:hover {
            background-color: #0056b3;
        }

        @media (max-width: 600px) {
            .container {
                margin: 20px;
                padding: 15px;
            }

            .next-step-btn {
                font-size: 16px;
                padding: 12px 20px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Account Binding Successful!</h1>
        </div>
        <div class="content">
            <p>Your account has been successfully bound to our platform. You're now ready to start processing payments and managing your account with Stripe.</p>
            <p>If you need further assistance, please reach out to our support team. Otherwise, you can continue by clicking the button below.</p>
        </div>
    </div>
</body>

</html>
`
  }

}

export const htmlTemplate = new HTMLTemplate();