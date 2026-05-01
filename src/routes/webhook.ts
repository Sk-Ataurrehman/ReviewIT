import {Router, Request, Response} from "express";
import crypto from "crypto"; 

const router = Router();

router.post('/',async (req: Request,res: Response)=>{
    const signature = req.headers["x-hub-signature-256"] as string;
    const body = req.body as Buffer;

    const secret = process.env.WEBHOOK_SECRET as string;

    const computed = "sha256="+crypto.createHmac('sha-256',secret).update(body).digest('hex');

    console.log("computed signature: ",computed);
    console.log("actual signature: ",signature);

    const isValid = crypto.timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(computed,'hex'));
    console.log("signature valid: ",isValid);
    

    console.log('in webhook');
    // console.log('request: ',JSON.parse(req.body.toString()));

    return res.status(200).json({message:"webhook"});
}) 

export {router as WebhookRouter}