import { createClient } from 'redis';

export type Payment = {
    correlationId: string;
    amount: number;
    requestedAt: string;
};

export type ResponseServiceHealth = {
    failing: boolean,
    minResponseTime: number
};

export type ResponsePaymentSummary = {
    totalRequests: number,
    totalAmount: number
}

const redisClient = createClient();

 redisClient.on('error', err => console.log('Redis Client Error', err));


 export async function createConnectionRedis() {
    await redisClient.connect();
 }

  export async function closeConnectionRedis() {
    await redisClient.close();
 }   
 

export async function receivePayment(correlationId: string, amount: number): Promise<void> {
     const requestedAt = new Date().toISOString();
        await redisClient.hSet(`payment:${requestedAt}`, {
            correlationId,
            "amount": amount,
            "requestedAt" : `${requestedAt}`,
            "paymentProcessor": '',
            "status_process": 'received',
        });
}

export async function paymentsSummary(from: string, to: string) : Promise<ResponsePaymentSummary> {
     
 const payments: any[] = [];
        const scanOption = {MATCH: 'payment:*'}
        for await (const keys of redisClient.scanIterator(scanOption)) {
             for(let i=0; i<keys.length; i++){
                const payment = await redisClient.hGetAll(keys[i] as string);
                payments.push(payment);
             }
        }

        if(from && to){
           const filteredPayments = payments.filter(payment => new Date(payment.requestedAt) 
           >= new Date(from) && new Date(payment.requestedAt) <= new Date(to));
           let totalAmount = filteredPayments.reduce(
            (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount), 0,);
            const summary = {totalRequests:filteredPayments.length,totalAmount:totalAmount};
           
           return summary;
        }
       let totalAmount = payments.reduce(
            (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount), 0,) ;
            const summary = {totalRequests:payments.length,totalAmount:totalAmount};
            return summary;

}

export async function listPaymentsReceived() : Promise<Payment[]> {
     
 const payments: any[] = [];
        const scanOption = {MATCH: 'payment:*'}
        for await (const keys of redisClient.scanIterator(scanOption)) {
             for(let i=0; i<keys.length; i++){
                const payment = await redisClient.hGetAll(keys[i] as string);
                payments.push(payment);
             }
        }
        const paymentReceived = payments.map( payment => {
         if(payment.status_process == 'received') {
         return {
                correlationId: payment.correlationId,
                amount: payment.amount,
                requestedAt: payment.requestedAt,
            
            }
         }else{
            return;
         
         }
        }) as Payment[];
        return paymentReceived;

}