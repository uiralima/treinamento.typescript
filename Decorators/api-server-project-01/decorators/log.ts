import { Request, Response } from "express";

export function logRoute(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    let req = args[0] as Request;
    let res = args[1] as Response;
    original.apply(this, args);
    console.log(`${req.ip} [${new Date().toISOString()}] ${req.hostname} ${req.originalUrl} ${req.method}`);
    if (["PUT", "POST"].indexOf(req.method) >= 0) {
      console.log(`\tBODY: ${JSON.stringify(req.body)}`)
    }
  }
}