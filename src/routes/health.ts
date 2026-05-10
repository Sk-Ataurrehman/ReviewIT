import {Router, Request, Response} from "express";
import { redis } from "../libs/redis";
import { prisma } from "../libs/prisma";

const router = Router();

router.get('/',async (req:Request,res:Response)=>{
    try {
        await redis.ping();
        await prisma.$connect();
    } catch(error){
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({status: "error", message: errorMessage})
    }
    return res.status(200).json({status:"ok", redis: "Connection success", database:"Connection success"});
}) 

export {router as HealthRouter}