'use strict'

const UserHelper = require('../../Helpers/UserHelper')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Organization = use('App/Models/Organization')

class OrganizationController {
  async addOrganizationWithResponsibleAndSubstitute (parent, arg, ctx) {
    const { organization, responsible, substitute } = arg
    const o = await Organization.create(organization)

    const u = await UserHelper.register({
      ...responsible,
      is_responsible: true,
      organization_id: o.id
    })

    if (substitute) {
      await UserHelper.register({
        ...substitute,
        is_responsible: true,
        organization_id: o.id,
        author_id: u.id,
        revisor_id: u.id
      })
    }

    o.author_id = u.id
    o.revisor_id = u.id

    const result = await o.save()
    return result
  }

  async updateOrganization (parent, arg, { auth }) {
    const { organization, data } = arg
    const o = await Organization.findByOrFail('uuid', organization.uuid)

    if (!o) {
      return
    }

    o.merge({
      ...data,
      revisor_id: auth.user.id
    })

    await o.save()
    await o.load('author')
    await o.load('revisor')
    await o.load('users')

    return o.toJSON()
  }

  static middlewares () {
    return {
      addOrganizationWithResponsibleAndSubstitute: [
        'organizationCreateValidator',
        'responsibleValidator',
        'substituteValidator'
      ],
      updateOrganization: [
        'authValidator',
        'organizationUpdateValidator'
      ]
    }
  }
}

module.exports = OrganizationController
