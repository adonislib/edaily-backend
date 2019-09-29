'use strict'

const moment = require('moment')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

class ResetPasswordController {
  async store ({ request, response }) {
    const { recovery_token: token, password } = request.all()

    const user = await User.findByOrFail('recovery_token', token)

    const tokenExpired = moment()
      .subtract('1', 'days')
      .isAfter(user.recovery_token_created_at)

    if (tokenExpired) {
      return response
        .status(401)
        .send({
          error: {
            message: 'O token de recuperação está expirado.'
          }
        })
    }

    user.recovery_token = null
    user.recovery_token_created_at = null
    user.password = password

    await user.save()
  }
}

module.exports = ResetPasswordController
