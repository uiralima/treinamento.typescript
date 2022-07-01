import { db } from "../app";
import { Request, Response } from "express";

export function auth(requiredRole: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const req = args[0] as Request;
      const res = args[1] as Response;
      const url = req.url;
      const entity = req.baseUrl.replace("/", "");
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(403).send("Not Authorized");
        return;
      }

      if (!isValidUser(authHeader)) {
        res.status(403).send("Invalid User");
        return;
      }

      if (!doesUserHavePermission(entity, requiredRole, authHeader)) {
        res.status(403).send("User does not have permission");
        return;
      }

      original.apply(this, args);
    }
  }
}

interface UserDetails {
  username: string;
  password: string;
}

function getUserDetails(authHeader: string): UserDetails {
  const base64Auth = (authHeader || "").split(" ")[1] || "";
  const strauth = Buffer.from(base64Auth, "base64").toString();
  const splitIndex = strauth.indexOf(":");
  const username = strauth.substring(0, splitIndex);
  const password = strauth.substring(splitIndex+1);
  return {
    username,
    password
  };
}

function isValidUser(authHeader: string): boolean {
  const details = getUserDetails(authHeader);
  const users = db.getData("/users");
  if (!users.hasOwnProperty(details.username)) {
    return false;
  }
  if (users[details.username].password !== details.password) {
    return false;
  }
  return true;
}

function doesUserHavePermission(entityName: string, requiredRole: string, authHeader: string): boolean {
  const users = db.getData("/users");
  const details = getUserDetails(authHeader);
  const userRoles = users[details.username].permissions[entityName];
  if (!userRoles) {
    return false;
  }
  if (userRoles.indexOf(requiredRole) >= 0) {
    return true;
  }
  return false;
}