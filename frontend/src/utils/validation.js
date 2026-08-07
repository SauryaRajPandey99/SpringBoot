const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const phonePattern = /^[0-9+()\-\s]{7,20}$/;

export function validateAuthForm(values) {
  const errors = {};

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!passwordPattern.test(values.password)) {
    errors.password = "Password must be at least 8 characters and include a letter and a number.";
  }

  return errors;
}

export function validateConsultantForm(values) {
  const errors = {};

  if (!values.name.trim() || values.name.trim().length < 2) {
    errors.name = "Enter at least 2 characters.";
  }

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!phonePattern.test(values.phone.trim())) {
    errors.phone = "Use 7 to 20 digits or phone symbols.";
  }

  if (!values.technology.trim()) {
    errors.technology = "Technology is required.";
  }

  const experience = Number(values.experience);
  if (!Number.isInteger(experience) || experience < 0 || experience > 50) {
    errors.experience = "Use a whole number from 0 to 50.";
  }

  return errors;
}

export function sanitizeConsultantPayload(values) {
  return {
    ...values,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    technology: values.technology.trim(),
    experience: Number(values.experience),
  };
}

