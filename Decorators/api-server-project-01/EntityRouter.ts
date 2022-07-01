import { db } from "./app";
import * as uuid from "uuid";
import express, { Router, Request, Response } from "express";
import BaseEntity, { EntityTypeInstance, EntityFactory } from "./entities/BaseEntity";
import { auth, validate, logRoute } from "./decorators";

export default class EntityRouter<T extends BaseEntity> {

    private _router: Router;

    get router(): Router {
        return this._router;
    }

    constructor(public name: string, private classRef: EntityTypeInstance<T>) {
        this._router = express.Router();
        this.addEntityRoutes();
    }

    addEntityRoutes() {
        // CREATE
        this._router.post("/", (req, res) => {
            this.createEntity(req, res);
        });

        // READ all
        this._router.get("/", (req, res) => {
            this.fetchAllEntities(req, res);
        });

        // READ one
        this._router.get("/:id", (req, res) => {
            this.fetchEntity(req, res);
        });

        // UPDATE
        this._router.put("/:id", (req, res) => {
            this.updateEntity(req, res);
        });

        // DELETE
        this._router.delete("/:id", (req, res) => {
            this.deleteEntity(req, res);
        });
    }

    @logRoute
    @auth("reader")
    private fetchAllEntities(req: Request, res: Response) {
        let data = {}
        data = db.getData(`/${this.name}`);
        res.json(data);
    }

    @logRoute
    @auth("reader")
    private fetchEntity(req: Request, res: Response) {
        let data = {}
        data = db.getData(`/${this.name}/${req.params.id}`);
        res.json(data);
    }

    @logRoute
    @auth("writer")
    private createEntity(req: Request, res: Response) {
        let newEntity = EntityFactory.fromPersistenceObject<T>(req.body, this.classRef);
        let errorMap = validate(newEntity);
        if (Object.keys(errorMap).length > 0) {
            const output = { errors: errorMap };
            res.status(400).json(output);
            return;
        }
        const idProperty = Reflect.getMetadata("entity:id", newEntity);
        newEntity[idProperty] = uuid.v4();
        db.push(`/${this.name}/${newEntity[idProperty]}`, newEntity.getPersistenceObject());
        res.status(200).json(newEntity);
    }

    @logRoute
    @auth("writer")
    private updateEntity(req: Request, res: Response) {
        let data = {};
        try {
            data = db.getData(`/${this.name}/$${req.params.id}`);
        }
        catch(err) {
            res.status(404).json({error: "Object does not exists"});
        }
        let updatedData = req.body;
        let updatedObj = EntityFactory.fromPersistenceObject(data, this.classRef);
        const propKeys = Object.keys(updatedData);
        for(const propKey of propKeys) {
            updatedObj[propKey] = updatedData[propKey];
        }

        let errorMap = validate(updatedObj);
        if (Object.keys(errorMap).length > 0) {
            const output = { errors: errorMap };
            res.status(400).json(output);
            return;
        }

        db.push(`/${this.name}/${req.params.id}`, updatedObj, false);
        data = db.getData(`/${this.name}/${req.params.id}`);
        res.status(200).json(data);
    }

    @logRoute
    @auth("deleter")
    private deleteEntity(req: Request, res: Response) {
        db.delete(`/${this.name}/${req.params.id}`);
        res.json({});
    }

}
