const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Amruta Deshpande <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'sendGrid',
        auth: {
          user: process.env.SENDGRID_USER_NAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
  }
  async send(template, subject) {
    // 1] render the HTML based on pug
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    // 2] Define email options
    const mailOption = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };
    //3 create a transport send mail

    await this.newTransport().sendMail(mailOption);
  }
  async sendWelcome() {
    await this.send('welcome', 'welcome to natours family');
  }
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'your password resettoken valid for only 10 minutes',
    );
  }
};

//OLD CODE FOR MAILTRAP

/*const nodemailer = require('nodemailer')

const sendEmail = async options => {
    //1 create transporter
const transporter = nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    port:process.env.EMAIL_PORT,
    auth:{
        user:process.env.EMAIL_USERNAME,
        pass:process.env.EMAIL_PASSWORD
    }
})
    //2 Define the email options

const mailOption ={
    from:'Amruta Deshpande <test@lx.io>',
    to:options.email,
    subject:options.subject,
    text:options.message

}

    //3 Actually send the email
await transporter.sendMail(mailOption)
}

module.exports = sendEmail;*/
