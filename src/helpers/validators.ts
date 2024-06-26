export function validateEmail(email: string): string | null {
  if (email.trim() === "") {
    return "You need to provide your email address to continue.";
  } else if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
    return "Email is not valid. Please provide a valid email address.";
  }
  return null;
}
