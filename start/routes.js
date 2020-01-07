'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

const Gql = use('Gql')

/*
  |--------------------------------------------------------------------------
  | graphql routes config
  |--------------------------------------------------------------------------
  */

Route.post('/', ctx => Gql.handle(ctx))

// If you want a playground
Route.get('/graphiql', ctx => Gql.handleUi(ctx))

/*
  |--------------------------------------------------------------------------
  | public routes config
  |--------------------------------------------------------------------------
  |
  | Routes with authentication not required.
  |
  */
Route.post('organizations', 'OrganizationController.store')
  .validator('organization/Store')

Route.get('avatars/:id', 'AvatarController.show').validator('file/Show')
Route.get('files/:id', 'FileController.show').validator('file/Show')

Route.post('users', 'UserController.store').validator('user/Store')

Route.post('sessions', 'SessionController.store').validator('Session')

Route.get('confirm', 'ConfirmationController.store').validator('Confirmation')

Route
  .post('forgot_password', 'ForgotPasswordController.store')
  .validator('ForgotPassword')

Route
  .post('reset_password', 'ResetPasswordController.store')
  .validator('ResetPassword')

Route
  .post('send_confirmation', 'SendConfirmationController.store')
  .validator('SendConfirmation')

/*
  |--------------------------------------------------------------------------
  | authenticated route configuration
  |--------------------------------------------------------------------------
  |
  | Routes requiring token validation.
  |
  */

Route.group(() => {
  Route.post('avatars', 'AvatarController.store').validator('avatar/Store')
  Route.post('files', 'FileController.store').validator('file/Store')
  Route.delete('files/:id', 'FileController.destroy').validator('file/Show')

  Route.put('users', 'UserController.update').validator('user/Update')

  Route.get('documents', 'Document/ReviewController.index')
  Route.put('documents/:id/forward', 'Document/ReviewController.update')

  Route.get('documents/following', 'Document/FollowController.index')

  Route.get('documents/:id', 'Document/DocumentController.show')
  Route.get(
    'organizations/:organizations_id/users/:users_id/documents',
    'Document/DocumentController.index'
  )

  Route
    .resource('organizations', 'OrganizationController')
    .apiOnly()
    .except(['store'])
    .validator(new Map(
      [
        [['organizations.update'], ['organization/Update']],
        [['organizations.show'], ['organization/Show']]
      ]
    ))

  Route
    .resource('organizations.users', 'Organization/UserController')
    .apiOnly()
    .validator(new Map(
      [
        [['organizations.users.store'], ['organization/user/Store']],
        [['organizations.users.update'], ['organization/user/Update']]
      ]
    ))
}).middleware(['auth'])
