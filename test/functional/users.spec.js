require('../../start/graphql')
require('../../start/gqlKernel')

const { test, trait, before, after } = use('Test/Suite')('Users')

const Helpers = use('Helpers')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

trait('Test/ApiClient')
trait('Auth/Client')

before(async () => {
  await User.truncate()
})

after(async () => {
  await User.truncate()
})

test('deve retornar uma lista vazia', async ({ client, assert }) => {
  const organization = await Factory.model('App/Models/Organization').create()
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        {
          users:getAllUsers(
            organization:{
              uuid:"${organization.uuid}"
            }
          ) {
            data {uuid}
          }
        }
      `
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data.users)
  assert.equal(response.body.data.users.data.length, 0)
})

test('deve retornar uma lista não vazia', async ({ client, assert }) => {
  const organization = await Factory.model('App/Models/Organization').create()
  const user = await Factory.model('App/Models/User').create({
    organization_id: organization.id
  })

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        {
          users:getAllUsers(
            organization:{
              uuid:"${organization.uuid}"
            }
          ) {
            data {uuid}
          }
        }
      `
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data.users)
  assert.equal(response.body.data.users.data.length, 1)
})

test('deve retornar uma lista paginada', async ({ client, assert }) => {
  const organization = await Factory.model('App/Models/Organization').create()
  await Factory.model('App/Models/User').create({ organization_id: organization.id })
  await Factory.model('App/Models/User').create({ organization_id: organization.id })
  await Factory.model('App/Models/User').create({ organization_id: organization.id })
  await Factory.model('App/Models/User').create({ organization_id: organization.id })

  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        {
          users:getAllUsers(
            organization:{
              uuid:"${organization.uuid}"
            },
            perPage: 1
          ) {
            data {uuid}
          }
        }
      `
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data.users)
  assert.equal(response.body.data.users.data.length, 1)
})

test('deve retornar um usuário', async ({ client, assert }) => {
  const organization = await Factory.model('App/Models/Organization').create()
  const user = await Factory.model('App/Models/User').create()

  const { uuid } = await Factory.model('App/Models/User').create({
    organization_id: organization.id
  })

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        {
          user:getUser(
            organization:{
              uuid:"${organization.uuid}"
            },
            user:{
              uuid:"${uuid}"
            }
          ) {
            uuid
          }
        }
      `
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data.user)
})

test('deve cadastrar um usuário', async ({ client, assert }) => {
  const organization = await Factory.model('App/Models/Organization').create()
  const user = await Factory.model('App/Models/User').create()
  const newUser = await Factory.model('App/Models/User').make({
    password: undefined
  })

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation (
          $organization: OrganizationFieldsInput!,
          $user: UserInput!
        ) {
          user: addUser (
            organization: $organization,
            user: $user
          )
        }
      `,
      variables: {
        organization: {
          uuid: organization.uuid
        },
        user: { ...newUser.toJSON() }
      }
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data.user)
})

test('deve evitar duplicar cadastro', async ({ client, assert }) => {
  const organization = await Factory.model('App/Models/Organization').create()
  const user = await Factory.model('App/Models/User').create()
  const newUser = await Factory.model('App/Models/User').make({
    password: undefined
  })

  await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation (
          $organization: OrganizationFieldsInput!,
          $user: UserInput!
        ) {
          user: addUser (
            organization: $organization,
            user: $user
          )
        }
      `,
      variables: {
        organization: {
          uuid: organization.uuid
        },
        user: { ...newUser.toJSON() }
      }
    }).end()

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation (
          $organization: OrganizationFieldsInput!,
          $user: UserInput!
        ) {
          user: addUser (
            organization: $organization,
            user: $user
          )
        }
      `,
      variables: {
        organization: {
          uuid: organization.uuid
        },
        user: { ...newUser.toJSON() }
      }
    }).end()

  response.assertStatus(422)
})

test('deve atualizar um usuário', async ({ client, assert }) => {
  const organization = await Factory.model('App/Models/Organization').create()
  const user = await Factory.model('App/Models/User').create({
    organization_id: organization.id
  })
  const newUser = await Factory.model('App/Models/User').make({
    password: undefined
  })

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation (
          $organization: OrganizationFieldsInput!,
          $user: UserFieldsInput!,
          $data: UserInput!
        ) {
          user: updateUser (
            organization: $organization,
            user: $user,
            data: $data
          ) {
            uuid
          }
        }
      `,
      variables: {
        organization: {
          uuid: organization.uuid
        },
        user: {
          uuid: user.uuid
        },
        data: { ...newUser.toJSON() }
      }
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data.user.uuid)
})

test('deve atualizar o perfil', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').create()
  const newUser = await Factory.model('App/Models/User').make()

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation {
          user:updateProfile(
            profile:{
              firstname:"${newUser.firstname}",
              lastname:"${newUser.lastname}",
              phone:"${newUser.phone}"
            }
          ) {
            firstname
            lastname
            phone
          }
        }
      `
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data.user.firstname, newUser.firstname)
  assert.exists(response.body.data.user.lastname, newUser.lastname)
  assert.exists(response.body.data.user.phone, newUser.phone)
})

test('deve validar a confirmação de senha', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation {
          isUpdated:updatePassword(
            password:{
              old:"888888",
              new:"123123",
              confirmation:"432432"
            }
          )
        }
      `
    }).end()

  response.assertStatus(400)
})

test('deve verificar acesso não autorizado', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').create()

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation {
          isUpdated:updatePassword(
            password:{
              old:"888888",
              new:"123123",
              confirmation:"123123"
            }
          )
        }
      `
    }).end()

  response.assertStatus(401)
})

test('deve validar a senha do usuário', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').create({
    password: '123456'
  })

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation {
          isUpdated:updatePassword(
            password:{
              old:"123456",
              new:"123123",
              confirmation:"123123"
            }
          )
        }
      `
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data)
  assert.equal(response.body.data.isUpdated, true)
})

test('deve atualizar o avatar', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').create()

  const { body: { uuid } } = await client
    .post('/avatars')
    .loginVia(user, 'jwt')
    .attach('file', Helpers.tmpPath('avatar.jpeg'))
    .end()

  const response = await client
    .post('/')
    .loginVia(user, 'jwt')
    .send({
      query: `
        mutation {
          isUpdated:updateAvatar(
            avatar:{
              uuid:"${uuid}"
            }
          )
        }
      `
    }).end()

  response.assertStatus(200)
  assert.exists(response.body.data)
  assert.equal(response.body.data.isUpdated, true)
})
