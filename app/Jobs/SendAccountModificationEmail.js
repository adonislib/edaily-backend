'use strict'

const Mail = use('Mail')
const Env = use('Env')
const Helpers = use('Helpers')

class SendAccountModificationEmail {
  static get concurrency () {
    return 1
  }

  static get key () {
    return 'SendAccountModificationEmail-job'
  }

  async handle ({ user, avatar, hasAttachment, team }) {
    console.log(`Job: ${SendAccountModificationEmail.key} - ${user.email}`)

    await Mail.send(
      ['emails.update_user'],
      {
        user,
        hasAttachment,
        team
      },
      message => {
        message
          .to(user.email, `${user.firstname} ${user.lastname}`)
          .from(
            Env.get('MAIL_FROM', 'notreply@edaily.com'),
            Env.get('MAIL_LOCAL', 'Team | Edaily')
          )
          .subject('Conta atualizada')

        if (hasAttachment) {
          message.attach(Helpers.tmpPath(`uploads/${avatar.file}`), {
            filename: avatar.name
          })
        }
      }
    )
  }
}

module.exports = SendAccountModificationEmail
