import BaseEntity from "./BaseEntity";
import { required, length, isEmail, isInteger, isPhone, entity, id, persist } from "../decorators";

entity("people")
export default class Person extends BaseEntity {
    @id
    id: string;
    
    @persist
    @required
    @length(3, 30)
    firstName: string;
    
    @persist
    @required
    @length(3, 30)
    lastName: string;
    
    @persist
    @required
    @isEmail
    email: string;
    @persist
    department: string;
    
    @persist   
    @required
    @isPhone 
    mobileNumber: string;
   
    @persist   
    @required
    @isInteger(1, 120)
    age: number;

}