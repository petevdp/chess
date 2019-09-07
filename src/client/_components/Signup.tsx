import React from 'react';
import { AuthService } from '../_services/auth.service';

interface SignupFormProps {
  authService: AuthService;
}

export const SignupForm: React.FC<SignupFormProps> = ({authService}) => {
  return <div>signup</div>
}
