import Express, { Request, Response} from 'express';
import Cors from 'cors';
import { createConnectionRedis,closeConnectionRedis, paymentsSummary, receivePayment } from './dataStoreRedis';


(async () => {

  
    await createConnectionRedis();
    const server = Express();
    
    server.use(Cors());
    server.use(Express.json());
    
    server.post('/payments',async (req: Request, res: Response) => {
        const { correlationId, amount } = req.body;
        await receivePayment(correlationId, amount);
        return res.status(201).send();
    })

    server.get('/payments-summary',async (req: Request, res: Response) => {
        const from = req.query.from as string;
        const to = req.query.to as string;
        const summary = await paymentsSummary(from, to);
        return res.json(summary);
    })


    server.use((err: Error, _req: Request, res: Response, ) => {
        return res.json({
            status: 'Error',
            message: err.message,
        });
    });

    server.listen(8000, ()=> {
        console.log('Server is Running port 8000!');
    })
})().catch(async() => {
    await closeConnectionRedis();
});



