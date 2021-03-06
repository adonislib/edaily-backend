'use strict'

const crypto = require('crypto')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */

const User = use('App/Models/User')
const Env = use('Env')
const Kue = use('Kue')
const Job = use('App/Jobs/SendForgotPasswordMail')

class ForgotPasswordController {
  async store ({ request }) {
    const email = request.input('email')
    const user = await User.findByOrFail('email', email)

    user.recovery_token = crypto.randomBytes(32).toString('hex')
    user.recovery_token_created_at = new Date()

    await user.save()

    if (Env.get('NODE_ENV') !== 'testing') {
      Kue.dispatch(Job.key, {
        user,
        link: `${request.input('redirect_url')}/reset?token=${user.recovery_token}`,
        team: Env.get('APP_NAME', 'Edaily')
      }, { attempts: 3 })
    }
  }
}

module.exports = ForgotPasswordController
