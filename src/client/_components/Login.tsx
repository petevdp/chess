import React, { useState } from 'react'
import { AuthServiceInterface } from '../_services/auth.service'
import { UserLogin } from '../../common/types'
import { Form, Button } from 'react-bootstrap'

import { Redirect } from 'react-router'
import { Center } from './Center'

interface LoginFormState extends UserLogin {
  status: 'clean' | 'evaluating' | 'rejected' | 'authenticated';
}

function useLoginForm (authService: AuthServiceInterface) {
  const [inputs, setInputs] = useState({ username: '', password: '', status: 'clean', userType: 'human' } as LoginFormState)

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    event.persist()
    authService.login(inputs)
  }

  const handleInputChange = (event: any) => {
    event.persist()
    const { name, value } = event.target
    setInputs(inputs => ({ ...inputs, [name]: value }))
  }
  return {
    handleSubmit,
    handleInputChange,
    inputs
  }
}

interface LoginFormProps {
  authService: AuthServiceInterface;
}
function LoginForm ({ authService }: LoginFormProps) {
  const { handleSubmit, handleInputChange, inputs } = useLoginForm(authService)
  const currentUser = authService.useCurrentUser()

  const { username, password, status } = inputs

  if (currentUser) {
    return <Redirect to="lobby" />
  }

  return (
    <div id="login">
      <h1>Log In</h1>
      <Form
        onSubmit={handleSubmit}
      >
        <Form.Group>
          <Form.Label>Username</Form.Label>
          <Form.Control
            placeholder="Enter Username"
            onChange={handleInputChange}
            name="username"
            value={username}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            placeholder="Enter Password"
            name="password"
            value={password}
            onChange={handleInputChange}
          />
        </Form.Group>
        <Button name="login" type="submit">Submit</Button>
        {(status === 'rejected') && 'rejected!'}
      </Form>
    </div>
  )
}

export function Login (props: LoginFormProps) {
  return (
    <Center>
      <LoginForm {...props} />
    </Center>
  )
}
