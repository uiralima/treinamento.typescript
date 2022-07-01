import validator from "validator";
import "reflect-metadata";

type ValidationFunction = (target: any, propertyKey: string, validatorOptions?: any) => string | void;

interface ValidationRule {
  validationOptions?: any;
  validator: ValidationFunction;
}

export function validate(object: any) {
  const keys = Reflect.getMetadata("validation:properties", object) as string[];
  let errorMap = {};
  
  if(!keys || !Array.isArray(keys)) {
    return errorMap;
  }

  for(const key of keys) {
    const rules = Reflect.getMetadata("validation:rules", object, key);
    if (!Array.isArray(rules)) {
      continue;
    }
    for(const rule of rules) {
      const errorMessage = rule.validator(object, key, rule.validationOptions);
      if (errorMessage) {
        errorMap[key] = errorMap[key] || [];
        errorMap[key].push(errorMessage);
      }
    }
  }
}

export function isEmail(target: any, propertyKey: string) {
  addValidation(target, propertyKey, emailValidator);
}

export function required(target: any, propertyKey: string) {
  addValidation(target, propertyKey, requiredValidator);
}

export function length(minimun: number, maximun: number) {
  const options = {
    minimun,
    maximun
  }
  return function (target: any, propertyKey: string) {
    addValidation(target, propertyKey, lengthValidator, options);
  }
}

export function isPhone(target: any, propertyKey: string) {
  addValidation(target, propertyKey, phoneValidator);
}

export function isInteger(minimun: number, maximun: number) {
  const options = {
    minimun,
    maximun
  }
  return function (target: any, propertyKey: string) {
    addValidation(target, propertyKey, integerValidator, options);
  }
}

function addValidation(target: any, propertyKey: string, validator: ValidationFunction, validationOptions?: any) {
  let objectProperties: string[] = Reflect.getMetadata("validation:properties", target) || [];
  if(!objectProperties.includes(propertyKey)) {
    objectProperties.push(propertyKey);
    Reflect.defineMetadata("validation:properties", objectProperties, target);
  }

  let validators: ValidationRule[] = Reflect.getMetadata("validation:rules", target, propertyKey) || [];
  let validationRule = {
    validator,
    validationOptions
  };
  validators.push(validationRule);
  Reflect.defineMetadata("validation:rules", validators, target, propertyKey);
}

function emailValidator(target: any, propertyKey: string): string | void {
  const value = target[propertyKey];
  if (value == null) {
    return;
  }
  const isValid = validator.isEmail(value);
  if (!isValid) {
    return `Property ${propertyKey} must be a valid email.`;
  }
  return;
}

function requiredValidator(target: any, propertyKey: string): string | void {
  let value = target[propertyKey];
  if (value) {
    return;
  }
  return `Property ${propertyKey} is required.`;
}

function integerValidator(target: any, propertyKey: string, validatorOptions: any): string | void {
  const value = target[propertyKey];
  if (value == null) {
    return;
  }
  const errorMessage = `Property ${propertyKey} must be an integer between ${validatorOptions.minimun} and ${validatorOptions.maximun}`;
  if ((!Number.isInteger(value)) || (value < validatorOptions.minimun) || (value > validatorOptions.maximun)) {
    return errorMessage
  }
  return;
}

function lengthValidator(target: any, propertyKey: string, validatorOptions: any): string | void {
  if (!validator.isLength(target[propertyKey] + "", validatorOptions)) {
    return `Property ${propertyKey} must be a string with length between ${validatorOptions.minimun} and ${validatorOptions.maximun}`;
  }
  return;
}

function phoneValidator(target: any, propertyKey: string): string | void {
  const value = target[propertyKey];
  if (value == null) {
    return;
  }
  const isValid = validator.isMobilePhone(value);
  if (!isValid) {
    return `Property ${propertyKey} must be a valid phone number.`;
  }
  return;
}