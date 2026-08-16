// validations.js — Input validation for user registration and admin user creation
//
// Returns { isValid: true } if everything passes, or
//         { isValid: false, errors: { field: "message" } } if something is wrong.

export function validateUserInput({ name, email, password, address }) {
  const errors = {};

  // --- Name ---
  // Must be a non-empty string between 10 and 60 characters
  if (!name || typeof name !== 'string') {
    errors.name = 'Name is required and must be a string.';
  } else if (name.length < 10 || name.length > 60) {
    errors.name = 'Name must be between 10 and 60 characters.';
  }

  // --- Email ---
  // Must match a basic email pattern like user@example.com
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string') {
    errors.email = 'Email is required.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Email must follow standard validation rules (e.g., user@example.com).';
  }

  // --- Address ---
  // Must be between 10 and 400 characters
  if (!address || typeof address !== 'string') {
    errors.address = 'Address is required.';
  } else if (address.length < 10 || address.length > 400) {
    errors.address = 'Address must be between 10 and 400 characters.';
  }

  // --- Password ---
  // Must be 8–16 characters, with at least one uppercase letter and one special character
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  } else if (password.length < 8 || password.length > 16) {
    errors.password = 'Password must be between 8 and 16 characters.';
  } else {
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecial   = /[^A-Za-z0-9]/.test(password);

    const pwdErrors = [];
    if (!hasUppercase) pwdErrors.push('at least one uppercase letter');
    if (!hasSpecial)   pwdErrors.push('at least one special character');

    if (pwdErrors.length > 0) {
      errors.password = `Password must include ${pwdErrors.join(' and ')}.`;
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}
